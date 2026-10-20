-- ═══════════════════════════════════════════════════════════════
-- Formulario de entregas (reemplaza los dos Google Forms de envío y
-- recolección en Rock Show).
-- Un contacto se identifica por su celular: si el mismo número vuelve
-- a llenar el formulario, se reutiliza el contacto en lugar de crear
-- uno nuevo. Cada envío del formulario es una fila en entregas.
-- Ejecutar en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

create table if not exists entrega_contactos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  telefono    text not null unique,  -- normalizado por normalizarTelefono(): 10 dígitos, sin lada de país ni espacios
  nombre      text not null,
  email       text,
  user_id     uuid references profiles(id) on delete set null,  -- cuenta LEGOD, si la tiene; la mayoría compra por WhatsApp
  -- Dirección: toda nulable, porque quien solo recoge en Rock Show no da domicilio
  calle       text,
  num_ext     text,  -- número exterior
  num_int     text,  -- número interior
  colonia     text,
  ciudad      text,
  estado      text,
  cp          text,  -- código postal
  referencia  text   -- referencia de ubicación
);

alter table entrega_contactos enable row level security;
-- Sin políticas públicas: solo el backend (service_role) lee/escribe.

-- Sin índice extra por telefono: el unique de arriba ya crea el índice.

create table if not exists entregas (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  contacto_id  uuid not null references entrega_contactos(id),
  tipo         text not null,              -- envio | rock_show
  paqueteria   text,                       -- solo para envíos
  recibe       text,                       -- nombre de quien recibe, si es distinto del contacto
  direccion    jsonb,                      -- fotografía de la dirección en el momento del envío
  piezas       text not null,              -- piezas/figuras a entregar
  foto         text,                       -- URL pública de la foto adjunta
  resta        numeric not null default 0, -- saldo pendiente que se cobra al entregar
  status       text not null default 'nueva'  -- nueva | atendida | conflicto
  -- conflicto: el teléfono ya existía como contacto y la persona dijo "no soy yo".
  -- El contacto NO se modificó; el dueño debe resolverlo a mano.
);

alter table entregas enable row level security;
-- Sin políticas públicas: solo el backend (service_role) lee/escribe.

create index if not exists entregas_created_idx on entregas (created_at desc);

-- Registro de intentos del endpoint que dice si un celular ya existe.
-- Sirve para limitar cuántas consultas hace una IP: sin ese límite,
-- alguien podría recorrer números de celular y obtener nombres y
-- direcciones parciales de clientes.
create table if not exists entrega_intentos (
  id          bigserial primary key,
  ip          text not null,
  created_at  timestamptz not null default now()
);

alter table entrega_intentos enable row level security;
-- Sin políticas públicas: solo el backend (service_role) lee/escribe.

create index if not exists entrega_intentos_ip_idx on entrega_intentos (ip, created_at desc);
