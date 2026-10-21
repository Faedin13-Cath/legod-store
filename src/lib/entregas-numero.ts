import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

/**
 * Número de bolsa para lo que se recoge en el Rock Show.
 *
 * Funciona como casillero, no como folio: se da el número libre más chico y,
 * al marcar la entrega como atendida, ese número vuelve a estar disponible.
 * Por eso los números se quedan chicos en vez de crecer sin fin — el dueño
 * los escribe a mano en la bolsa física.
 *
 * "Libre" lo decide el mismo criterio que el índice único de la migración
 * (`numero is not null and status <> 'atendida'`), así que los dos no pueden
 * discrepar sobre qué número está ocupado.
 */
export async function numeroLibre(supabase: Admin): Promise<number> {
  const { data } = await supabase
    .from('entregas')
    .select('numero')
    .not('numero', 'is', null)
    .neq('status', 'atendida')
    .order('numero')

  return primerHueco((data ?? []).map(f => f.numero as number))
}

/** El entero positivo más chico que no está en la lista ya ordenada. */
export function primerHueco(ocupados: number[]): number {
  let n = 1
  for (const ocupado of ocupados) {
    if (ocupado > n) break   // se encontró el hueco
    if (ocupado === n) n++   // sigue corrido: se busca el siguiente
  }
  return n
}
