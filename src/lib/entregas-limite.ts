import type { SupabaseClient } from '@supabase/supabase-js'

// Tope de peticiones por IP para los endpoints públicos de entregas. Se lleva en la
// tabla entrega_intentos porque en Vercel un contador en memoria es por instancia y
// se borra en frío: no limitaría nada.

const MAX_INTENTOS = 10      // por IP...
const VENTANA_SEG = 60       // ...en esta ventana
const LIMPIEZA_SEG = 3600    // los intentos más viejos se borran

/**
 * Registra el intento y dice si la IP ya pasó el tope. 'error' = no se pudo contar:
 * quien llama debe negarse a contestar, porque sin tope el endpoint se puede barrer.
 */
export async function registrarIntento(
  supabase: SupabaseClient, ip: string, etiqueta: string,
): Promise<'ok' | 'tope' | 'error'> {
  const ahora = Date.now()
  const { error: errInsert } = await supabase.from('entrega_intentos').insert({ ip })
  if (errInsert) {
    console.error(`[${etiqueta}] no se pudo registrar el intento`, errInsert.message)
    return 'error'
  }
  // Limpieza oportunista; si falla no pasa nada.
  await supabase
    .from('entrega_intentos')
    .delete()
    .lt('created_at', new Date(ahora - LIMPIEZA_SEG * 1000).toISOString())
  const { count, error: errCount } = await supabase
    .from('entrega_intentos')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', new Date(ahora - VENTANA_SEG * 1000).toISOString())
  if (errCount || count === null) {
    console.error(`[${etiqueta}] no se pudo contar intentos`, errCount?.message)
    return 'error'
  }
  return count > MAX_INTENTOS ? 'tope' : 'ok'
}
