-- ═══════════════════════════════════════════════════════════════
-- Sistema de administradores (multi-admin)
-- Antes el acceso a /admin estaba pegado a un solo correo hardcodeado
-- en el código. Ahora es una columna en profiles — se activa/desactiva
-- desde la base de datos, sin tocar código.
-- Ejecutar en Supabase → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

alter table profiles add column if not exists is_admin boolean not null default false;

-- Deja como admin al dueño original de la tienda
update profiles set is_admin = true where lower(email) = 'faedin@hotmail.com';
