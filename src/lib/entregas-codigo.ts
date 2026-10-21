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


export type Revision = { resultado: 'ok' | 'invalido' | 'error'; restantes: number }

/**
 * Núcleo de la revisión. Solo cuenta el código más reciente sin usar y sin vencer.
 * Cada intento se cuenta ANTES de comparar, con una actualización condicionada al valor
 * leído: si dos peticiones adivinan a la vez, solo una pasa y el tope de intentos no se
 * evade. Con `gastar` el código bueno se marca usado (un solo uso); sin `gastar` solo se
 * revisa, y el intento de un código bueno se devuelve para que el envío final no lo pague.
 * 'error' = falló la base de datos (no es culpa del cliente).
 */
async function revisar(
  supabase: SupabaseClient, contactoId: string, codigo: string, gastar: boolean,
): Promise<Revision> {
  const invalido = (restantes = 0): Revision => ({ resultado: 'invalido', restantes })
  const fallo: Revision = { resultado: 'error', restantes: 0 }
  if (!/^\d{6}$/.test(codigo)) return invalido()

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
    return fallo
  }
  if (!fila || fila.intentos >= CODIGO_MAX_INTENTOS) return invalido()

  const { data: contado, error: errIntento } = await supabase
    .from('entrega_codigos')
    .update({ intentos: fila.intentos + 1 })
    .eq('id', fila.id)
    .eq('intentos', fila.intentos)
    .select('id')
  if (errIntento) {
    console.error('[entregas/codigo] contar intento', errIntento.message)
    return fallo
  }
  if (!contado || contado.length === 0) return invalido() // otra petición se adelantó

  const bueno = hashCodigo(codigo), guardado = String(fila.codigo_hash)
  const coincide = bueno.length === guardado.length &&
    timingSafeEqual(Buffer.from(bueno), Buffer.from(guardado))
  if (!coincide) return invalido(CODIGO_MAX_INTENTOS - (fila.intentos + 1))

  if (!gastar) {
    // Solo se revisó: el intento no se le cobra al código bueno. Si la devolución falla
    // no pasa nada grave (queda un intento menos); el código sigue sirviendo.
    await supabase.from('entrega_codigos')
      .update({ intentos: fila.intentos }).eq('id', fila.id).eq('intentos', fila.intentos + 1)
    return { resultado: 'ok', restantes: CODIGO_MAX_INTENTOS - fila.intentos }
  }

  // Gastarlo: si dos peticiones con el código bueno llegan juntas, solo una lo logra.
  const { data: gastado, error: errGasto } = await supabase
    .from('entrega_codigos')
    .update({ usado: true })
    .eq('id', fila.id)
    .eq('usado', false)
    .select('id')
  if (errGasto) {
    console.error('[entregas/codigo] gastar código', errGasto.message)
    return fallo
  }
  return gastado && gastado.length > 0 ? { resultado: 'ok', restantes: 0 } : invalido()
}

/** Revisa el código y, si es bueno, lo gasta. Es lo que usa el envío final. */
export async function verificarYGastarCodigo(
  supabase: SupabaseClient, contactoId: string, codigo: string,
): Promise<'ok' | 'invalido' | 'error'> {
  return (await revisar(supabase, contactoId, codigo, true)).resultado
}

/** Revisa el código sin gastarlo, para avisarle al cliente en el paso 1. El fallo sí cuenta. */
export function verificarCodigo(
  supabase: SupabaseClient, contactoId: string, codigo: string,
): Promise<Revision> {
  return revisar(supabase, contactoId, codigo, false)
}
