/**
 * Preventas — figuras que se venden antes de llegar al inventario.
 *
 * Se marcan en Shopify con etiquetas, igual que el resto de metadatos del
 * catálogo (rareza, categoría, estado), para no depender de metafields que
 * habría que exponer aparte a la Storefront API:
 *
 *   preventa        → el producto es preventa
 *   pv-full-800     → precio pagando el total de una vez
 *   pv-split-1000   → precio total si se paga en dos partes
 *
 * Pagar diferido cuesta más que pagar completo: el precio "split" es el alto.
 */

/** Porción del precio diferido que se cobra al reservar; el resto va al llegar. */
export const DEPOSIT_PCT = 0.60

export const PREVENTA_TAG = 'preventa'

const FULL_RE  = /^pv-full-(\d+)$/i
const SPLIT_RE = /^pv-split-(\d+)$/i

export type PreventaPricing = {
  /** Precio pagando todo de una vez. */
  full: number
  /** Precio total pagando en dos partes (más alto que `full`). */
  split: number
  /** Lo que se cobra hoy en la modalidad diferida. */
  deposit: number
  /** Lo que queda por pagar cuando llega la figura. */
  pending: number
}

/**
 * Lee los precios de preventa de las etiquetas de Shopify.
 * Devuelve null si el producto no es preventa o le faltan las dos etiquetas
 * de precio — sin ambos precios no hay preventa que ofrecer.
 */
export function parsePreventa(tags: string[]): PreventaPricing | null {
  const lower = tags.map(t => t.toLowerCase())
  if (!lower.includes(PREVENTA_TAG)) return null

  const full  = lower.map(t => t.match(FULL_RE)?.[1]).find(Boolean)
  const split = lower.map(t => t.match(SPLIT_RE)?.[1]).find(Boolean)
  if (!full || !split) return null

  const splitTotal = parseInt(split, 10)
  const deposit    = Math.round(splitTotal * DEPOSIT_PCT)

  return {
    full:    parseInt(full, 10),
    split:   splitTotal,
    deposit,
    pending: splitTotal - deposit,
  }
}

/**
 * Mientras esté en `false`, el catálogo de preventas solo lo ven las cuentas
 * con `profiles.is_admin`. Ponerlo en `true` la abre a todo el público.
 */
export const PREVENTAS_PUBLIC = false
