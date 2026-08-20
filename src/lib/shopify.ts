const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const token  = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!
const endpoint = `https://${domain}/api/2024-01/graphql.json`

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
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
  variants: { edges: { node: { id: string; title: string; price: { amount: string }; quantityAvailable: number | null } }[] }
}

/* ── Queries ─────────────────────────────────────────────────── */
const PRODUCT_FIELDS = `
  id handle title description availableForSale tags
  priceRange { minVariantPrice { amount } }
  images(first: 3) { edges { node { url altText } } }
  variants(first: 5) { edges { node { id title price { amount } quantityAvailable } } }
`

export async function getProducts(): Promise<ShopifyProduct[]> {
  const data = await shopifyFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(`
    { products(first: 100, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${PRODUCT_FIELDS} } }
    }}
  `)
  return data.products.edges.map(e => e.node)
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const data = await shopifyFetch<{ productByHandle: ShopifyProduct | null }>(`
    { productByHandle(handle: "${handle}") { ${PRODUCT_FIELDS} } }
  `)
  return data.productByHandle
}

/* ── Adapter: ShopifyProduct → local Product ─────────────────── */
import type { Product, ProductCat, ProductType, ProductTag } from '@/types'

const CAT_TAGS = ['starwars','marvel','dc','harry','stranger','castle','sports','pixar','custom']
const PRODUCT_TAGS = ['nuevo','restock','oferta','edicion-limitada','sellado','usado','agotado','popular','limitada','custom','promo']
const BL_ID_RE = /^[a-z]{2,4}\d{3,}/i   // sh0276, sw0123, hp001, etc.
const CAT_LABELS: Record<string, string> = {
  starwars: 'Star Wars', marvel: 'Marvel', dc: 'DC Comics',
  harry: 'Harry Potter', stranger: 'Stranger Things',
  sports: 'Deportes', castle: 'Castle', pixar: 'Pixar', custom: 'Custom',
}

export function shopifyToProduct(p: ShopifyProduct): Product {
  const cat = (p.tags.find(t => CAT_TAGS.includes(t.toLowerCase())) as ProductCat) ?? 'custom'
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
    state:  'new',
    rarity: 'comun',
    photo:  p.images.edges[0]?.node.url,
    tags:   productTags,
    desc:   p.description,
    blId,
  }
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
