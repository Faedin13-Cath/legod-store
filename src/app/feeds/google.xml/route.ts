import { getProductsForSeo, shopifyToProduct, isPreventa, shopifyImg } from '@/lib/shopify'
import { titulo, descripcion } from '@/lib/producto-seo'
import type { Product } from '@/types'

/**
 * Feed de productos para Google Merchant Center (Shopping gratis).
 *
 * La tienda es headless: la app "Google & YouTube" de Shopify mandaría a la
 * gente a jangos-le-god.myshopify.com. Este feed sale del sitio y apunta cada
 * producto a su ficha en www.jangos-store.com. Merchant Center lo vuelve a
 * leer solo cada día. Especificación:
 * https://support.google.com/merchants/answer/7052112
 */

const BASE = 'https://www.jangos-store.com'

// Se regenera cada hora; Merchant Center lo lee una vez al día.
export const revalidate = 3600

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const tag = (nombre: string, valor: string | number | undefined) =>
  valor === undefined || valor === '' ? '' : `<g:${nombre}>${esc(String(valor))}</g:${nombre}>`

function categoriaGoogle(p: Product): string {
  // Taxonomía de Google en texto: https://support.google.com/merchants/answer/6324436
  return p.type === 'minifig'
    ? 'Toys & Games > Toys > Dolls, Playsets & Toy Figures > Action & Toy Figures'
    : 'Toys & Games > Toys > Building Toys > Construction Set Toys'
}

/** Un producto con opciones sale como un artículo por opción, agrupados. */
/** `shopifyId`: el número del producto en Shopify. Google acepta ids de hasta
 *  50 caracteres y varios handles son más largos; el número es corto, único
 *  y no cambia aunque se renombre el producto. */
function articulos(p: Product, shopifyId: string): string[] {
  const link = `${BASE}/tienda/${p.id}`
  const foto = shopifyImg(p.photo, 1000)
  const usado = p.state === 'usado' || p.state === 'crack'
  const comunes = [
    tag('link', link),
    tag('image_link', foto),
    tag('condition', usado ? 'used' : 'new'),
    // Una custom no es de LEGO; ninguna tiene GTIN (código de barras).
    p.cat !== 'custom' ? tag('brand', 'LEGO') : '',
    tag('identifier_exists', 'no'),
    tag('google_product_category', categoriaGoogle(p)),
    tag('product_type', `${p.type === 'minifig' ? 'Minifiguras' : 'Sets'} > ${p.tag}`),
  ]

  const opciones = p.variants ?? [{ id: '', title: '', price: p.price, stock: p.stock }]
  return opciones.map(v => {
    const numId = v.id ? v.id.split('/').pop()! : ''
    return [
    '<item>',
    tag('id', numId || shopifyId),
    // Con opciones, la ficha abre ya en la del anuncio: Google compara el
    // precio del feed con el de la página y rechaza si no cuadran.
    numId ? tag('link', `${link}?variante=${numId}`) : '',
    p.variants ? tag('item_group_id', shopifyId) : '',
    tag('title', v.title ? `${titulo(p)} (${v.title})` : titulo(p)),
    tag('description', [p.desc, descripcion(p)].filter(Boolean).join(' ')),
    tag('price', `${v.price.toFixed(2)} MXN`),
    tag('availability', v.stock > 0 ? 'in_stock' : 'out_of_stock'),
    ...comunes.filter(t => !(numId && t.startsWith('<g:link>'))),
    '</item>',
  ].filter(Boolean).join('')
  })
}

export async function GET() {
  const productos = (await getProductsForSeo())
    .map(raw => ({ p: shopifyToProduct(raw), shopifyId: raw.id.split('/').pop()! }))
    // Las preventas se cobran desde /preventas con otro precio; sin foto,
    // Google rechaza el artículo.
    .filter(({ p }) => !isPreventa(p) && p.photo)

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>',
    `<title>Jango's Store</title><link>${BASE}</link>`,
    '<description>Minifiguras y sets LEGO originales</description>',
    ...productos.flatMap(({ p, shopifyId }) => articulos(p, shopifyId)),
    '</channel></rss>',
  ].join('\n')

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
