import type { SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { CODIGO_MAX_INTENTOS } from '@/lib/entregas'

// Solo servidor: usa 'crypto' de Node. Por eso no vive en entregas.ts, que el
// formulario importa en el navegador (traería un polyfill de crypto de ~60 kB).

/** Código de 6 dígitos (con ceros a la izquierda). randomInt, no Math.random: es una llave. */
export function generarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** El código nunca se guarda en claro: la tabla la lee cualquiera con la llave de servicio. */
export function hashCodigo(codigo: string): string {
  return createHash('sha256').update(codigo).digest('hex')
}


/**
 * Revisa el código que escribió el cliente y, si es bueno, lo gasta (un solo uso).
 * Solo cuenta el código más reciente sin usar y sin vencer. Cada intento se cuenta
 * ANTES de comparar, con una actualización condicionada al valor leído: si dos
 * peticiones adivinan a la vez, solo una pasa y el tope de intentos no se evade.
 * 'error' = falló la base de datos (no es culpa del cliente).
 */
export async function verificarYGastarCodigo(
  supabase: SupabaseClient, contactoId: string, codigo: string,
): Promise<'ok' | 'invalido' | 'error'> {
  if (!/^\d{6}$/.test(codigo)) return 'invalido'

  const { data: fila, error } = await supabase
    .from('entrega_codigos')
    .select('id, codigo_hash, intentos')
    .eq('contacto_id', contactoId)
    .eq('usado', false)
    .gt('expira_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[entregas/codigo] leer código', error.message)
    return 'error'
  }
  if (!fila || fila.intentos >= CODIGO_MAX_INTENTOS) return 'invalido'

  const { data: contado, error: errIntento } = await supabase
    .from('entrega_codigos')
    .update({ intentos: fila.intentos + 1 })
    .eq('id', fila.id)
    .eq('intentos', fila.intentos)
    .select('id')
  if (errIntento) {
    console.error('[entregas/codigo] contar intento', errIntento.message)
    return 'error'
  }
  if (!contado || contado.length === 0) return 'invalido' // otra petición se adelantó

  const bueno = hashCodigo(codigo), guardado = String(fila.codigo_hash)
  const coincide = bueno.length === guardado.length &&
    timingSafeEqual(Buffer.from(bueno), Buffer.from(guardado))
  if (!coincide) return 'invalido'

  // Gastarlo: si dos peticiones con el código bueno llegan juntas, solo una lo logra.
  const { data: gastado, error: errGasto } = await supabase
    .from('entrega_codigos')
    .update({ usado: true })
    .eq('id', fila.id)
    .eq('usado', false)
    .select('id')
  if (errGasto) {
    console.error('[entregas/codigo] gastar código', errGasto.message)
    return 'error'
  }
  return gastado && gastado.length > 0 ? 'ok' : 'invalido'
}
