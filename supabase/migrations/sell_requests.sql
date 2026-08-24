-- ═══════════════════════════════════════════════════════════════
-- Solicitudes de venta (Véndenos)
-- El cliente sube fotos + datos; la tienda las revisa en Administración.
-- Ejecutar en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create table if not exists sell_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  phone       text not null,
  description text not null,
  payment     text,
  photos      jsonb not null default '[]',   -- URLs públicas de las fotos
  status      text not null default 'nueva'  -- nueva | cotizada | cerrada
);

alter table sell_requests enable row level security;
-- Sin políticas públicas: solo el backend (service_role) lee/escribe.

create index if not exists sell_requests_created_idx on sell_requests (created_at desc);
