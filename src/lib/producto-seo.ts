import type { Product } from '@/types'

/** Título y descripción de un producto para Google: los usan la ficha
 *  (metadatos y datos estructurados) y el feed de Merchant Center, así que
 *  en todos lados se anuncia igual. */

export const esSet = (p: Product) => p.type !== 'minifig'

/** "Marvel", "Star Wars"… Las categorías genéricas no aportan al título. */
export function tema(p: Product): string {
  return p.cat === 'otros' || p.cat === 'custom' ? '' : p.tag
}

export function titulo(p: Product): string {
  const id = p.blId ? ` (${p.blId.toUpperCase()})` : ''
  if (p.cat === 'custom') return `${p.name} — Minifigura custom`
  const t = tema(p)
  // Los sets ya se llaman "Nombre (Set 75017)": no repetir "Set".
  const tipo = esSet(p) ? (/\bset\b/i.test(p.name) ? '' : 'Set ') : 'Minifigura '
  return `${p.name}${id} — ${tipo}LEGO${t ? ` ${t}` : ''}`
}

export function precioVisible(p: Product): number {
  return p.preventa?.full ?? p.price
}

export function descripcion(p: Product): string {
  const t = tema(p)
  const que = p.cat === 'custom'
    ? 'minifigura custom'
    : `${esSet(p) ? 'set' : 'minifigura'} LEGO original${t ? ` de ${t}` : ''}`
  const estado =
    p.type === 'set-sealed' ? ', sellado'
    : p.state === 'usado'   ? ', usada'
    : p.state === 'crack'   ? ', con detalle'
    : ''
  const precio = `$${precioVisible(p).toLocaleString('es-MX')} MXN`
  const disp = p.preventa ? 'En preventa.' : p.stock > 0 ? '' : 'Agotada por ahora.'
  return [
    `${p.name}: ${que}${estado}. ${p.variants ? 'Desde ' : ''}${precio}.`,
    disp,
    'Envíos a todo México desde CDMX y apartado con 60%.',
  ].filter(Boolean).join(' ')
}
