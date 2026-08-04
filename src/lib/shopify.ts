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
  if (json.errors) throw new Error(json.errors[0].message)
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
  variants: { edges: { node: { id: string; title: string; price: { amount: string } } }[] }
}

/* ── Queries ─────────────────────────────────────────────────── */
const PRODUCT_FIELDS = `
  id handle title description availableForSale tags
  priceRange { minVariantPrice { amount } }
  images(first: 3) { edges { node { url altText } } }
  variants(first: 5) { edges { node { id title price { amount } } } }
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

const CAT_TAGS = ['starwars','marvel','dc','harry','stranger','castle','sports','custom']
const PRODUCT_TAGS = ['nuevo','restock','oferta','edicion-limitada','sellado','usado','agotado','popular','limitada','custom','promo']
const CAT_LABELS: Record<string, string> = {
  starwars: 'Star Wars', marvel: 'Marvel', dc: 'DC Comics',
  harry: 'Harry Potter', stranger: 'Stranger Things',
  sports: 'Deportes', castle: 'Castle', custom: 'Custom',
}

export function shopifyToProduct(p: ShopifyProduct): Product {
  const cat = (p.tags.find(t => CAT_TAGS.includes(t.toLowerCase())) as ProductCat) ?? 'custom'
  const type: ProductType = p.tags.includes('set-sealed') ? 'set-sealed'
                          : p.tags.includes('set-used')   ? 'set-used'
                          : 'minifig'
  const productTags = p.tags.filter(t => PRODUCT_TAGS.includes(t)) as ProductTag[]

  return {
    id:     p.handle,
    sku:    p.handle.toUpperCase(),
    name:   p.title,
    cat,
    type,
    tag:    CAT_LABELS[cat] ?? 'Minifigura',
    price:  Math.round(parseFloat(p.priceRange.minVariantPrice.amount)),
    stock:  p.availableForSale ? 1 : 0,
    state:  'new',
    rarity: 'comun',
    photo:  p.images.edges[0]?.node.url,
    tags:   productTags,
    desc:   p.description,
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
