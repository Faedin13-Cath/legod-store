-- Tabla de preferencias de alertas por usuario
create table if not exists alert_prefs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null unique,
  restock    boolean not null default true,
  pricedrop  boolean not null default false,
  drop       boolean not null default true,
  whatsapp   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solo el propio usuario puede ver/editar sus prefs
alter table alert_prefs enable row level security;

create policy "own prefs" on alert_prefs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
