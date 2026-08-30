-- Figuras de preventa que ya llegaron a la tienda.
--
-- El sistema no puede saber cuándo aterriza un envío del extranjero, así que
-- la tienda marca cada figura a mano. Se marca una sola vez por figura y eso
-- libera el cobro del saldo para todos los que la apartaron.
--
-- La fila existe = la figura llegó. Se borra para deshacer.

create table if not exists preventa_arrivals (
  handle      text primary key,
  arrived_at  timestamptz not null default now()
);

alter table preventa_arrivals enable row level security;

-- Qué figuras llegaron no es información sensible, y el cliente necesita
-- leerla para saber qué puede pagar. Escribir sigue siendo solo del webhook
-- y del panel, que usan la service role key e ignoran RLS.
create policy "llegadas visibles" on preventa_arrivals
  for select using (true);
