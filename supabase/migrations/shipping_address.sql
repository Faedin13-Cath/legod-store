-- ═══════════════════════════════════════════════════════════════
-- Dirección de envío en el perfil
-- Necesaria porque las compras con saldo completo crean la orden en
-- Shopify directamente (bypass) y nunca pasaban por la página donde
-- Shopify pide la dirección → salían como "Sin cliente".
-- Ejecutar en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

alter table profiles add column if not exists ship_name    text;
alter table profiles add column if not exists ship_phone   text;
alter table profiles add column if not exists ship_street  text;  -- calle y número
alter table profiles add column if not exists ship_colonia text;  -- colonia / referencia
alter table profiles add column if not exists ship_city    text;  -- ciudad / municipio
alter table profiles add column if not exists ship_state   text;  -- estado
alter table profiles add column if not exists ship_zip     text;  -- código postal

-- Campos granulares para exportar a la carga masiva de Estafeta sin re-capturar
alter table profiles add column if not exists ship_num_ext text;  -- número exterior
alter table profiles add column if not exists ship_num_int text;  -- número interior
alter table profiles add column if not exists ship_ref     text;  -- referencia de ubicación

-- Snapshot de la dirección en cada orden → exportar a Estafeta sin cruzar tablas
alter table orders add column if not exists shipping jsonb;
