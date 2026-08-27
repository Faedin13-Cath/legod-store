-- ═══════════════════════════════════════════════════════════════
-- Mensajes de contacto (formulario /contacto)
-- El cliente escribe un mensaje; la tienda lo revisa en Administración.
-- Ejecutar en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create table if not exists contact_messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  status      text not null default 'nueva'  -- nueva | respondida
);

alter table contact_messages enable row level security;
-- Sin políticas públicas: solo el backend (service_role) lee/escribe.

create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
