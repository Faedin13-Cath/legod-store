-- ═══════════════════════════════════════════════════════════════
-- Arreglo del sistema de lealtad
-- Ejecutar en Supabase → SQL Editor ANTES de desplegar el código.
-- ═══════════════════════════════════════════════════════════════

-- 1. Puntos de por vida: determinan el NIVEL y nunca bajan al canjear.
--    (points_total sigue siendo el saldo canjeable y sí baja.)
alter table profiles add column if not exists points_lifetime integer not null default 0;

-- Backfill: puntos actuales + todo lo que ya se canjeó en el pasado
update profiles p
   set points_lifetime = coalesce(p.points_total, 0) + coalesce((
         select sum(h.points) from points_history h
          where h.user_id = p.id and h.type = 'redeem'
       ), 0)
 where p.points_lifetime = 0;

-- 2. Registro de canjes que requieren envío físico (figura sorpresa)
create table if not exists loyalty_redemptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  reward_pts     integer not null,
  reward_label   text    not null,
  saldo_awarded  integer not null default 0,
  needs_shipping boolean not null default false,
  fulfilled      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists loyalty_redemptions_pending_idx
  on loyalty_redemptions (needs_shipping, fulfilled) where needs_shipping and not fulfilled;

alter table loyalty_redemptions enable row level security;

drop policy if exists "own redemptions" on loyalty_redemptions;
create policy "own redemptions" on loyalty_redemptions
  for select using (auth.uid() = user_id);

-- 3. Canje atómico — cierra la condición de carrera.
--    El UPDATE con `points_total >= p_pts` en el WHERE es la garantía:
--    dos requests simultáneos no pueden pasar ambos.
create or replace function redeem_points(
  p_user_id uuid,
  p_pts     integer,
  p_saldo   integer,
  p_label   text,
  p_ship    boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points  integer;
  v_balance integer;
begin
  if p_pts <= 0 or p_saldo <= 0 then
    return json_build_object('ok', false, 'error', 'invalid');
  end if;

  update profiles
     set points_total = points_total - p_pts,
         balance      = balance + p_saldo
   where id = p_user_id
     and points_total >= p_pts
  returning points_total, balance into v_points, v_balance;

  if not found then
    return json_build_object('ok', false, 'error', 'insufficient');
  end if;

  insert into points_history (user_id, points, type, description)
  values (p_user_id, p_pts, 'redeem', 'Canje: ' || p_label);

  insert into balance_transactions (user_id, type, amount, description)
  values (p_user_id, 'topup', p_saldo, 'Canje de puntos: ' || p_label);

  insert into loyalty_redemptions (user_id, reward_pts, reward_label, saldo_awarded, needs_shipping)
  values (p_user_id, p_pts, p_label, p_saldo, p_ship);

  return json_build_object('ok', true, 'points_total', v_points, 'balance', v_balance);
end;
$$;

-- Solo el backend (service_role) puede canjear. Nadie llama esto desde el navegador.
revoke all on function redeem_points(uuid, integer, integer, text, boolean) from public, anon, authenticated;
grant execute on function redeem_points(uuid, integer, integer, text, boolean) to service_role;
