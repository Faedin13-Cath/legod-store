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
 *   pv-dep-70           → % de anticipo de esa figura          (opcional)
 *   pv-badge-mega-oferta → distintivo que se pinta sobre la foto (opcional)
 *
 * Sin `pv-split-*` la figura solo se puede pagar completa. Cuando existe,
 * pagar diferido puede costar más (el precio "split" es el alto) o costar
 * igual, si solo se quiere partir el pago sin recargo.
 */

/** Anticipo por defecto: se usa cuando la figura no trae `pv-dep-*`. */
export const DEPOSIT_PCT = 0.60

export const PREVENTA_TAG = 'preventa'

const FULL_RE  = /^pv-full-(\d+)$/i
const SPLIT_RE = /^pv-split-(\d+)$/i
const DEP_RE   = /^pv-dep-(\d+)$/i
const BADGE_RE = /^pv-badge-(.+)$/i

export type PreventaSplit = {
  /** Precio total pagando en dos partes (igual o más alto que `full`). */
  total: number
  /** Lo que se cobra hoy. */
  deposit: number
  /** Lo que queda por pagar cuando llega la figura. */
  pending: number
  /** Anticipo en porcentaje entero, para escribirlo en la interfaz. */
  pct: number
  /** Cuánto más cuesta diferir el pago. 0 = mismo precio que pagar completo. */
  surcharge: number
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
  const depTag   = lower.map(t => t.match(DEP_RE)?.[1]).find(Boolean)
  const badgeTag = lower.map(t => t.match(BADGE_RE)?.[1]).find(Boolean)

  const full = parseInt(fullTag, 10)

  // Un `pv-dep-*` fuera de 1–99 dejaría el anticipo en 0 o en el total, que no
  // es un pago partido: se ignora y manda el porcentaje por defecto.
  const depPct = depTag && +depTag > 0 && +depTag < 100
    ? +depTag / 100
    : DEPOSIT_PCT

  let split: PreventaSplit | null = null
  if (splitTag) {
    const total   = parseInt(splitTag, 10)
    const deposit = Math.round(total * depPct)
    split = {
      total, deposit,
      pending:   total - deposit,
      pct:       Math.round(depPct * 100),
      surcharge: total - full,
    }
  }

  const badge = badgeTag
    ? badgeTag.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
    : null

  return { full, split, badge }
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
 * En `false` el catálogo de preventas solo lo ven las cuentas con
 * `profiles.is_admin`. En `true` lo ve cualquiera: apartar sigue pidiendo
 * cuenta, pero mirar es libre.
 */
export const PREVENTAS_PUBLIC = true

/**
 * Llegada estimada del lote en preventa. Es tentativa: los envíos desde el
 * extranjero se retrasan seguido, así que en la interfaz siempre se dice
 * junto con la advertencia de que puede tardar más.
 */
export const LLEGADA_TENTATIVA = '4 de noviembre'
