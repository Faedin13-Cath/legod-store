import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardPurchasePoints } from '@/lib/loyalty'

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

type Shipping = {
  name: string; phone: string
  street: string; numExt?: string; numInt?: string
  colonia?: string; city: string; state: string; zip: string; ref?: string; carrier?: string
}

/** Convierte nuestra dirección al formato que espera Shopify. */
function toShopifyAddress(s: Shipping, email?: string) {
  const [first, ...rest] = s.name.trim().split(/\s+/)
  const address1 = [s.street, s.numExt].filter(Boolean).join(' ')
    + (s.numInt ? ` Int. ${s.numInt}` : '')
  return {
    first_name: first,
    last_name:  rest.join(' ') || first,
    address1,
    address2:   s.colonia ?? '',
    city:       s.city,
    province:   s.state,
    zip:        s.zip,
    country:    'Mexico',
    phone:      s.phone,
    ...(email ? { email } : {}),
  }
}

async function checkoutWithBalance(
  items: { id: string; name: string; price: number; qty: number }[],
  balanceToUse: number,
  userId: string,
  shipping?: Shipping,
  email?: string,
) {
  if (!adminToken) return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const applied  = Math.min(balanceToUse, subtotal)

  const supabase = createAdminClient()

  // Release stale holds (>2h) before computing effective balance
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('balance_transactions')
    .delete()
    .eq('user_id', userId)
    .eq('type', 'hold')
    .lt('created_at', twoHoursAgo)

  const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single()
  const currentBalance = prof?.balance ?? 0

  const { data: holds } = await supabase
    .from('balance_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'hold')

  const heldAmount       = holds?.reduce((s, h) => s + (h.amount as number), 0) ?? 0
  const effectiveBalance = currentBalance - heldAmount

  if (applied > effectiveBalance) {
    return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
  }

  // Full saldo coverage — create + auto-complete Shopify order (visible in Admin) without customer checkout
  if (applied >= subtotal) {
    // La orden se crea directo en Shopify (bypass del checkout del cliente),
    // así que la dirección de envío tiene que venir de nuestro formulario.
    if (!shipping || !shipping.name || !shipping.street || !shipping.numExt || !shipping.city || !shipping.state || !shipping.zip) {
      return NextResponse.json({ error: 'Falta la dirección de envío', needShipping: true }, { status: 400 })
    }

    // Guardar la dirección en el perfil para no volver a pedirla
    await supabase.from('profiles').update({
      ship_name: shipping.name, ship_phone: shipping.phone, ship_street: shipping.street,
      ship_num_ext: shipping.numExt ?? null, ship_num_int: shipping.numInt ?? null,
      ship_colonia: shipping.colonia ?? null, ship_city: shipping.city,
      ship_state: shipping.state, ship_zip: shipping.zip, ship_ref: shipping.ref ?? null,
    }).eq('id', userId)

    // 1. Create draft order
    const draftRes = await fetch(`https://${domain}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
      body: JSON.stringify({
        draft_order: {
          line_items: items.map(i => ({
            title: i.name, price: i.price.toFixed(2), quantity: i.qty,
            requires_shipping: true, taxable: false,
          })),
          applied_discount: {
            description: 'Saldo Jango\'s Store', value_type: 'fixed_amount',
            value: applied.toFixed(2), amount: applied.toFixed(2), title: 'Saldo Jango\'s Store',
          },
          // Cliente + dirección → la orden deja de salir como "Sin cliente"
          ...(email ? { email } : {}),
          shipping_address: toShopifyAddress(shipping),
          note: `Compra con saldo completo — $${applied.toLocaleString('es-MX')} MXN`,
          tags: 'saldo,compra',
          note_attributes: [
            { name: 'tipo',         value: 'compra' },
            { name: 'balance_used', value: String(applied) },
            { name: 'user_id',      value: userId },
          ],
        },
      }),
    })
    if (!draftRes.ok) {
      console.error('[checkout saldo completo] draft error:', await draftRes.text())
      return NextResponse.json({ error: 'Error creando orden' }, { status: 500 })
    }
    const draftData = await draftRes.json()
    const draftId   = draftData?.draft_order?.id
    if (!draftId) return NextResponse.json({ error: 'No se obtuvo ID del draft' }, { status: 500 })

    // 2. Complete it → creates real Shopify order marked as paid (visible in Admin)
    const completeRes  = await fetch(`https://${domain}/admin/api/2024-01/draft_orders/${draftId}/complete.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    })
    const completeData  = await completeRes.json()
    const shopifyOrderId = String(completeData?.draft_order?.order_id ?? draftId)

    // 3. Deduct balance
    const newBalance = Math.max(0, currentBalance - applied)
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)
    await supabase.from('balance_transactions').insert({
      user_id: userId, type: 'spent', amount: applied,
      description: 'Compra con saldo', reference_id: shopifyOrderId,
    })

    // 4. Add points with real order ID (prevents webhook double-processing)
    await awardPurchasePoints(supabase, {
      userId,
      amount:      subtotal,
      description: `Compra con saldo — ${items.map(i => i.name).join(', ')}`,
      orderId:     shopifyOrderId,
    })

    // 5. Save order in Supabase for "Mis pedidos"
    await supabase.from('orders').upsert({
      user_id: userId, shopify_order_id: shopifyOrderId, order_number: shopifyOrderId,
      total_price: subtotal, financial_status: 'paid', fulfillment_status: 'unfulfilled',
      line_items: items.map(i => ({ title: i.name, quantity: i.qty, price: String(i.price) })),
      shipping, carrier: shipping.carrier ?? null, created_at: new Date().toISOString(),
    }, { onConflict: 'shopify_order_id' })

    return NextResponse.json({ redirectUrl: '/pedidos' })
  }

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
          description: 'Saldo Jango\'s Store',
          value_type:  'fixed_amount',
          value:        applied.toFixed(2),
          amount:       applied.toFixed(2),
          title:        'Saldo Jango\'s Store',
        },
        note: `Compra con saldo — Descuento: $${applied.toLocaleString('es-MX')} MXN`,
        tags: 'saldo,compra',
        redirect_url: 'https://legod-store-2.vercel.app/pedidos',
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

  const data         = await res.json()
  const invoiceUrl   = data?.draft_order?.invoice_url
  const draftOrderId = String(data?.draft_order?.id ?? '')
  if (!invoiceUrl) return NextResponse.json({ error: 'No se obtuvo URL de pago' }, { status: 500 })

  // Reserve balance — deduct only when orders/paid webhook confirms payment
  if (applied > 0 && draftOrderId) {
    await supabase.from('balance_transactions').insert({
      user_id:      userId,
      type:         'hold',
      amount:       applied,
      description:  `Reserva para pago`,
      reference_id: draftOrderId,
    })
  }

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Balance checkout path → Admin API Draft Order with discount
  if (body.useBalance && body.balanceToUse > 0 && body.userId) {
    return checkoutWithBalance(body.items, body.balanceToUse, body.userId, body.shipping, body.userEmail)
  }

  const { items, userEmail }: { items: { id: string; qty: number }[]; userEmail?: string } = body

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

  // 2. Create Shopify cart — pre-fill buyer email so webhook can match the user
  const buyerIdentity = userEmail ? `, buyerIdentity: { email: "${userEmail}" }` : ''
  const cartData = await gql(`
    mutation {
      cartCreate(input: { lines: [${lines.join(',')}]${buyerIdentity} }) {
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
