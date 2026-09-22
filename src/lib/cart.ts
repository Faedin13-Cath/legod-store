import type { CartItem, Product, ProductVariant } from '@/types'

/** Identifica un renglón del carrito. Dos opciones del mismo producto (con
 *  mech / sin mech) comparten `id` pero son renglones distintos. */
export const cartKey = (it: Pick<CartItem, 'id' | 'variantId'>) =>
  it.variantId ? `${it.id}#${it.variantId}` : it.id

/** Nombre con la opción elegida: así llega a la orden de Shopify, al apartado
 *  y al WhatsApp, y en todos lados se sabe cuál de las dos se llevó. */
export const lineName = (it: Pick<CartItem, 'name' | 'variantTitle'>) =>
  it.variantTitle ? `${it.name} (${it.variantTitle})` : it.name

/** La opción que se elige de entrada: la primera que tenga piezas. */
export const defaultVariant = (p: Product): ProductVariant | undefined =>
  p.variants?.find(v => v.stock > 0) ?? p.variants?.[0]
