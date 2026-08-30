-- Casillero: pedidos que el cliente pidió que le guardáramos para mandarlos
-- después junto con otras compras, pagando el envío una sola vez.
--
-- Un pedido está en el casillero cuando su `carrier` es 'Guardar en mi
-- casillero' y todavía no se le asignó un envío. `shipment_id` los agrupa:
-- todos los pedidos con el mismo id salen en la misma caja.

alter table orders add column if not exists shipment_id text;

create index if not exists orders_casillero_idx
  on orders (user_id, carrier)
  where shipment_id is null;

-- Envíos consolidados. Uno por cada vez que un cliente pide que le manden
-- lo que tiene guardado.
create table if not exists shipments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  carrier      text not null,
  cost         integer not null,
  shipping     jsonb,
  status       text not null default 'pending'
               check (status in ('pending', 'paid', 'shipped', 'cancelled')),
  tracking_number text,
  order_id     text,
  created_at   timestamptz not null default now()
);

create index if not exists shipments_user_idx on shipments (user_id, created_at desc);

alter table shipments enable row level security;

-- Cada quien ve solo sus envíos. Las escrituras las hace el webhook con la
-- service role key, que ignora RLS.
create policy "envios propios" on shipments
  for select using (auth.uid() = user_id);
