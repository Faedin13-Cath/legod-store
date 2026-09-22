-- Índices para las tablas principales, que se crearon desde el panel de
-- Supabase y no traían más que su llave primaria. Cada uno corresponde a un
-- filtro que el código hace seguido; con pocos registros no se nota, pero sin
-- ellos cada consulta recorre la tabla completa y se va alentando con el tiempo.
--
-- Es seguro correrlo más de una vez (if not exists) y no bloquea la tabla por
-- mucho: son tablas chicas. Pegarlo en Supabase → SQL Editor → Run.

-- El webhook de Shopify busca al cliente por su correo en cada pedido pagado.
create index if not exists profiles_email_idx on profiles (email);
-- Perfil público por su @handle.
create index if not exists profiles_handle_idx on profiles (handle);

-- "Mis pedidos": los de un usuario, del más nuevo al más viejo.
create index if not exists orders_user_idx on orders (user_id, created_at desc);

-- Saldo: movimientos de un usuario y sus reservas (type = 'hold') en cada compra.
create index if not exists balance_tx_user_type_idx on balance_transactions (user_id, type, created_at desc);

-- "Mis apartados" y los apartados activos.
create index if not exists apartados_user_idx on apartados (user_id, status);

-- El webhook revisa aquí si un pedido ya se procesó, en cada pedido pagado.
create index if not exists points_history_order_idx on points_history (order_id);
create index if not exists points_history_user_idx on points_history (user_id, created_at desc);

-- "Mi colección".
create index if not exists collection_items_user_idx on collection_items (user_id, added_at desc);
