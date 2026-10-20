import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizarTelefono } from '@/lib/entregas'

/**
 * Ids de los perfiles de LEGOD cuyo celular coincide con `telefono`.
 * Los teléfonos están guardados en ~8 formatos distintos, así que no se puede
 * comparar en SQL. Se traen SOLO id y teléfonos (nunca nombres ni direcciones),
 * se normalizan aquí y se pagina porque PostgREST corta en 1000 filas.
 * Devuelve null si la consulta falla (distinto de "no hay coincidencias").
 */
export async function perfilesPorTelefono(
  supabase: SupabaseClient,
  telefono: string,
): Promise<string[] | null> {
  const coincidencias: string[] = []
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, whatsapp, ship_phone')
      .order('id')
      .range(desde, desde + PAGINA - 1)
    if (error) {
      console.error('[entregas] perfiles', error.message)
      return null
    }
    const perfiles = data ?? []
    for (const p of perfiles) {
      if (
        (p.whatsapp && normalizarTelefono(p.whatsapp) === telefono) ||
        (p.ship_phone && normalizarTelefono(p.ship_phone) === telefono)
      ) coincidencias.push(p.id)
    }
    if (perfiles.length < PAGINA) break
  }
  return coincidencias
}
