import { NextRequest, NextResponse } from 'next/server'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const token      = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const endpoint   = `https://${domain}/api/2024-01/graphql.json`

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

async function checkoutWithBalance(
  items: { id: string; name: string; price: number; qty: number }[],
  balanceToUse: number,
  userId: string,
) {
  if (!adminToken) return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })

  const subtotal       = items.reduce((s, i) => s + i.price * i.qty, 0)
  const applied        = Math.min(balanceToUse, subtotal)

  const res = await fetch(`https://${domain}/admin/api/2024-01/draft_orders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: JSON.stringify({
      draft_order: {
        line_items: items.map(i => ({
          title:             i.name,
          price:             i.price.toFixed(2),
          quantity:          i.qty,
          requires_shipping: true,
          taxable:           false,
        })),
        applied_discount: {
          description: 'Saldo LEGOD',
          value_type:  'fixed_amount',
          value:        applied.toFixed(2),
          amount:       applied.toFixed(2),
          title:        'Saldo LEGOD',
        },
        note: `Compra con saldo LEGOD — Descuento: $${applied.toLocaleString('es-MX')} MXN`,
        tags: 'saldo,compra',
        note_attributes: [
          { name: 'tipo',         value: 'compra' },
          { name: 'balance_used', value: String(applied) },
          { name: 'user_id',      value: userId },
        ],
      },
    }),
  })

  if (!res.ok) {
    console.error('[checkout balance] Draft order error:', await res.text())
    return NextResponse.json({ error: 'Error creando orden' }, { status: 500 })
  }

  const data       = await res.json()
  const invoiceUrl = data?.draft_order?.invoice_url
  if (!invoiceUrl) return NextResponse.json({ error: 'No se obtuvo URL de pago' }, { status: 500 })

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Balance checkout path → Admin API Draft Order with discount
  if (body.useBalance && body.balanceToUse > 0 && body.userId) {
    return checkoutWithBalance(body.items, body.balanceToUse, body.userId)
  }

  const { items }: { items: { id: string; qty: number }[] } = body

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
