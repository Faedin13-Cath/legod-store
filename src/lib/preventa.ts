/**
 * Preventas — figuras que se venden antes de llegar al inventario.
 *
 * Se marcan en Shopify con etiquetas, igual que el resto de metadatos del
 * catálogo (rareza, categoría, estado), para no depender de metafields que
 * habría que exponer aparte a la Storefront API:
 *
 *   preventa            → el producto es preventa
 *   pv-full-800         → precio pagando el total de una vez  (obligatorio)
 *   pv-split-1000       → precio total pagando en dos partes   (opcional)
 *   pv-badge-mega-oferta → distintivo que se pinta sobre la foto (opcional)
 *
 * Sin `pv-split-*` la figura solo se puede pagar completa. Cuando existe,
 * pagar diferido cuesta más: el precio "split" siempre es el alto.
 */

/** Porción del precio diferido que se cobra al reservar; el resto va al llegar. */
export const DEPOSIT_PCT = 0.60

export const PREVENTA_TAG = 'preventa'

const FULL_RE  = /^pv-full-(\d+)$/i
const SPLIT_RE = /^pv-split-(\d+)$/i
const BADGE_RE = /^pv-badge-(.+)$/i

export type PreventaSplit = {
  /** Precio total pagando en dos partes (más alto que `full`). */
  total: number
  /** Lo que se cobra hoy. */
  deposit: number
  /** Lo que queda por pagar cuando llega la figura. */
  pending: number
}

export type PreventaPricing = {
  /** Precio pagando todo de una vez. */
  full: number
  /** null si la figura solo se vende pagando completo. */
  split: PreventaSplit | null
  /** Texto del distintivo, ya legible (p.ej. "Mega oferta"). */
  badge: string | null
}

/**
 * Lee la configuración de preventa de las etiquetas de Shopify.
 * Devuelve null si el producto no es preventa o no trae precio de pago
 * completo — sin ese precio no hay nada que ofrecer.
 */
export function parsePreventa(tags: string[]): PreventaPricing | null {
  const lower = tags.map(t => t.toLowerCase())
  if (!lower.includes(PREVENTA_TAG)) return null

  const fullTag = lower.map(t => t.match(FULL_RE)?.[1]).find(Boolean)
  if (!fullTag) return null

  const splitTag = lower.map(t => t.match(SPLIT_RE)?.[1]).find(Boolean)
  const badgeTag = lower.map(t => t.match(BADGE_RE)?.[1]).find(Boolean)

  let split: PreventaSplit | null = null
  if (splitTag) {
    const total   = parseInt(splitTag, 10)
    const deposit = Math.round(total * DEPOSIT_PCT)
    split = { total, deposit, pending: total - deposit }
  }

  const badge = badgeTag
    ? badgeTag.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
    : null

  return { full: parseInt(fullTag, 10), split, badge }
}

/** Lo que se cobra hoy y lo que queda pendiente, según la modalidad elegida. */
export function amountsFor(pricing: PreventaPricing, modalidad: Modalidad) {
  if (modalidad === 'split' && pricing.split) {
    return {
      total:   pricing.split.total,
      today:   pricing.split.deposit,
      pending: pricing.split.pending,
    }
  }
  return { total: pricing.full, today: pricing.full, pending: 0 }
}

export type Modalidad = 'completo' | 'split'

/**
 * Mientras esté en `false`, el catálogo de preventas solo lo ven las cuentas
 * con `profiles.is_admin`. Ponerlo en `true` la abre a todo el público.
 */
export const PREVENTAS_PUBLIC = false
