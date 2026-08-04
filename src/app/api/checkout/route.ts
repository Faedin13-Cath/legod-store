import { NextRequest, NextResponse } from 'next/server'

const domain   = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const token    = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!
const endpoint = `https://${domain}/api/2024-01/graphql.json`

async function gql(query: string) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  })
  return res.json()
}

export async function POST(req: NextRequest) {
  const { items }: { items: { id: string; qty: number }[] } = await req.json()

  // 1. Resolve variant IDs from Shopify using product handle
  const lines: string[] = []
  for (const item of items) {
    const handle = item.id.toLowerCase()
    const data = await gql(`
      { productByHandle(handle: "${handle}") {
          variants(first: 1) { edges { node { id } } }
      }}
    `)
    const variantId = data?.data?.productByHandle?.variants?.edges?.[0]?.node?.id
    if (variantId) {
      lines.push(`{ merchandiseId: "${variantId}", quantity: ${item.qty} }`)
    }
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: 'No matching products found in Shopify' }, { status: 400 })
  }

  // 2. Create Shopify cart
  const cartData = await gql(`
    mutation {
      cartCreate(input: { lines: [${lines.join(',')}] }) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }
  `)

  const checkoutUrl = cartData?.data?.cartCreate?.cart?.checkoutUrl
  if (!checkoutUrl) {
    return NextResponse.json({ error: 'Could not create cart' }, { status: 500 })
  }

  return NextResponse.json({ checkoutUrl })
}
