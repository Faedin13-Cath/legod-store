-- Preventas: figuras compradas antes de llegar al inventario.
-- Se parece a `apartados`, pero sin fecha límite: el saldo se liquida cuando
-- la figura llega, no en un plazo fijo.

create table if not exists preventas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  items       jsonb not null default '[]'::jsonb,
  -- 'completo' = se pagó todo al reservar; 'split' = 60% ahora, resto al llegar;
  -- 'mixta' = un mismo pedido con figuras de las dos modalidades
  modalidad   text not null check (modalidad in ('completo', 'split', 'mixta')),
  total       integer not null,
  pagado      integer not null,
  pendiente   integer not null default 0,
  status      text not null default 'active'
              check (status in ('active', 'completed', 'cancelled')),
  order_id    text,
  created_at  timestamptz not null default now()
);

create index if not exists preventas_user_idx    on preventas (user_id, created_at desc);
create unique index if not exists preventas_order_idx on preventas (order_id) where order_id is not null;

alter table preventas enable row level security;

-- Cada quien ve solo sus preventas. Las escrituras las hace el webhook con la
-- service role key, que ignora RLS.
create policy "preventas propias" on preventas
  for select using (auth.uid() = user_id);
