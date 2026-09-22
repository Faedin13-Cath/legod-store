const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const token  = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!
const endpoint = `https://${domain}/api/2024-01/graphql.json`

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>, revalidate?: number): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    // En el servidor, `revalidate` deja la respuesta en la caché de Next unos
    // minutos; sin él, cada petición va directo a Shopify.
    ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' as const }),
  })
  const json = await res.json()
  if (json.errors) {
    // Tolera errores parciales (p.ej. quantityAvailable requiere el scope
    // unauthenticated_read_product_inventory) mientras haya data de vuelta.
    if (!json.data) throw new Error(json.errors[0].message)
    console.warn('[shopify] errores parciales:', json.errors.map((e: { message: string }) => e.message).join('; '))
  }
  return json.data as T
}

/* ── Types ───────────────────────────────────────────────────── */
export interface ShopifyProduct {
  id: string
  handle: string
  title: string
  description: string
  priceRange: { minVariantPrice: { amount: string } }
  images: { edges: { node: { url: string; altText: string | null } }[] }
  tags: string[]
  availableForSale: boolean
  variants: { edges: { node: { id: string; title: string; availableForSale: boolean; price: { amount: string }; compareAtPrice: { amount: string } | null; quantityAvailable: number | null } }[] }
}

/* ── Queries ─────────────────────────────────────────────────── */
const PRODUCT_FIELDS = `
  id handle title description availableForSale tags
  priceRange { minVariantPrice { amount } }
  images(first: 3) { edges { node { url altText } } }
  variants(first: 10) { edges { node { id title availableForSale price { amount } compareAtPrice { amount } quantityAvailable } } }
`

/* ── Cache en memoria (60s) — evita repegar a Shopify al navegar ── */
const TTL = 60_000
let _productsCache: { data: ShopifyProduct[]; at: number } | null = null
const _handleCache = new Map<string, { data: ShopifyProduct | null; at: number }>()
const fresh = (at: number) => Date.now() - at < TTL

/** Todo el catálogo, del más nuevo al más viejo. La Storefront API da 250 por
 *  página; se piden hasta 4 (1,000 productos), que es de sobra por ahora. */
async function traerCatalogo(revalidate?: number): Promise<ShopifyProduct[]> {
  const list: ShopifyProduct[] = []
  let after: string | null = null
  for (let i = 0; i < 4; i++) {
    const cursor: string = after ? `, after: "${after}"` : ''
    const data = await shopifyFetch<{ products: { edges: { node: ShopifyProduct }[]; pageInfo: { hasNextPage: boolean; endCursor: string } } }>(`
      { products(first: 250, sortKey: CREATED_AT, reverse: true${cursor}) {
          edges { node { ${PRODUCT_FIELDS} } }
          pageInfo { hasNextPage endCursor }
      }}
    `, undefined, revalidate)
    list.push(...data.products.edges.map(e => e.node))
    if (!data.products.pageInfo.hasNextPage) break
    after = data.products.pageInfo.endCursor
  }
  return list
}

/** Para el servidor (páginas de categoría, sitemap): cachea 5 minutos. */
export function getProductsForSeo(): Promise<ShopifyProduct[]> {
  return traerCatalogo(300)
}

export async function getProducts(): Promise<ShopifyProduct[]> {
  if (_productsCache && fresh(_productsCache.at)) return _productsCache.data
  const list = await traerCatalogo()
  _productsCache = { data: list, at: Date.now() }
  // aprovecha para llenar el cache por handle
  for (const p of list) _handleCache.set(p.handle, { data: p, at: Date.now() })
  return list
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const cached = _handleCache.get(handle)
  if (cached && fresh(cached.at)) return cached.data
  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>(`
    { productByHandle(handle: "${handle}") { ${PRODUCT_FIELDS} } }
  `)
  _handleCache.set(handle, { data: data.productByHandle, at: Date.now() })
  return data.productByHandle
}

/** Para el servidor (título, descripción y HTML que lee Google). Cachea 5
 *  minutos: precio y stock exactos los vuelve a pedir la ficha al abrirse. */
export async function getProductForSeo(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>(
    `query($h: String!) { productByHandle(handle: $h) { ${PRODUCT_FIELDS} } }`,
    { h: handle },
    300,
  )
  return data.productByHandle
}

/** Foto del CDN de Shopify al ancho que se va a mostrar. Sin esto se baja el
 *  original, que en las fotos subidas a mano puede pesar varios cientos de KB.
 *  Otras URLs (BrickLink, locales) pasan igual. */
export function shopifyImg(url: string | undefined, width: number): string | undefined {
  if (!url || !url.includes('cdn.shopify.com')) return url
  const u = new URL(url)
  u.searchParams.set('width', String(width))
  return u.toString()
}

/* ── Adapter: ShopifyProduct → local Product ─────────────────── */
import type { Product, ProductCat, ProductType, ProductTag } from '@/types'
import { parsePreventa } from '@/lib/preventa'

const CAT_TAGS = ['starwars','marvel','dc','harry','stranger','castle','sports','pixar','series','city','ninjago','lotr','bionicle','animales','espacio','piratas','aventureros','piezas','peliculas','videojuegos','custom']
const PRODUCT_TAGS = ['nuevo','restock','oferta','edicion-limitada','sellado','usado','agotado','popular','limitada','custom','promo','nycc']
const BL_ID_RE = /^[a-z]{2,4}\d{3,}/i   // sh0276, sw0123, hp001, etc.
const CAT_LABELS: Record<string, string> = {
  starwars: 'Star Wars', marvel: 'Marvel', dc: 'DC Comics',
  harry: 'Harry Potter', stranger: 'Stranger Things',
  sports: 'Deportes', castle: 'Castle', pixar: 'Pixar', series: 'Series', animales: 'Animales',
  city: 'City', lotr: 'El Señor de los Anillos', ninjago: 'Ninjago', bionicle: 'Bionicle',
  espacio: 'Espacio', piratas: 'Piratas', aventureros: 'Aventureros',
  piezas: 'Piezas y accesorios', peliculas: 'Películas', videojuegos: 'Videojuegos',
  // Sin categoría no es 'Custom': en esta tienda eso significa figura no oficial.
  otros: 'LEGO original', custom: 'Custom',
}

export function shopifyToProduct(p: ShopifyProduct): Product {
  const cat = (p.tags.find(t => CAT_TAGS.includes(t.toLowerCase())) as ProductCat) ?? 'otros'
  const type: ProductType = p.tags.includes('set-sealed') ? 'set-sealed'
                          : p.tags.includes('set-used')   ? 'set-used'
                          : 'minifig'
  const productTags = p.tags.filter(t => PRODUCT_TAGS.includes(t)) as ProductTag[]
  const blId = p.tags.find(t => BL_ID_RE.test(t))?.toLowerCase()

  return {
    id:     p.handle,
    sku:    p.handle.toUpperCase(),
    name:   p.title,
    cat,
    type,
    tag:    CAT_LABELS[cat] ?? 'Minifigura',
    price:  Math.round(parseFloat(p.priceRange.minVariantPrice.amount)),
    // Inventario real de Shopify (suma de variantes). Si el token aún no tiene
    // el scope de inventario, quantityAvailable llega null → cae al comportamiento
    // anterior (1 si está disponible).
    stock:  (() => {
      const qty = p.variants.edges.reduce((s, e) => s + (e.node.quantityAvailable ?? 0), 0)
      return qty > 0 ? qty : (p.availableForSale ? 1 : 0)
    })(),
    // El "precio de comparación" de Shopify. Solo se pasa si de verdad es más
    // alto: si alguien lo deja igual o por debajo, tachar ese número sería
    // inventarle un descuento al cliente.
    ...(() => {
      const antes = parseFloat(p.variants.edges[0]?.node.compareAtPrice?.amount ?? '0')
      const ahora = parseFloat(p.priceRange.minVariantPrice.amount)
      return antes > ahora ? { priceAntes: Math.round(antes) } : {}
    })(),
    // Sin esto, un set usado se anunciaba como "Nuevo · sin uso".
    state:  p.tags.includes('detalle') ? 'crack'
          : p.tags.includes('usado')   ? 'usado'
          : 'new',
    rarity: p.tags.includes('legendaria') ? 'legendaria'
          : p.tags.includes('unica')    ? 'unica'
          : p.tags.includes('limitada') ? 'limitada'
          : p.tags.includes('rara')     ? 'rara'
          : 'comun',
    photo:  p.images.edges[0]?.node.url,
    tags:   productTags,
    desc:   p.description,
    blId,
    ...(parsePreventa(p.tags) ? { preventa: parsePreventa(p.tags)! } : {}),
    ...(() => {
      // Un producto sin opciones trae una sola variante "Default Title".
      const opciones = p.variants.edges.map(e => e.node).filter(v => v.title !== 'Default Title')
      if (opciones.length < 2) return {}
      return {
        variants: opciones.map(v => ({
          id:    v.id,
          title: v.title,
          price: Math.round(parseFloat(v.price.amount)),
          stock: v.quantityAvailable ?? (v.availableForSale ? 1 : 0),
        })),
      }
    })(),
  }
}

/** Los productos en preventa se venden solo desde /preventas, no en la tienda. */
export function isPreventa(p: Product): boolean {
  return !!p.preventa
}

/* ── Cart mutations ──────────────────────────────────────────── */
export async function cartCreate(lines: { merchandiseId: string; quantity: number }[]) {
  const data = await shopifyFetch<{ cartCreate: { cart: { id: string; checkoutUrl: string } } }>(`
    mutation {
      cartCreate(input: { lines: [${lines.map(l => `{ merchandiseId: "${l.merchandiseId}", quantity: ${l.quantity} }`).join(',')}] }) {
        cart { id checkoutUrl }
      }
    }
  `)
  return data.cartCreate.cart
}
