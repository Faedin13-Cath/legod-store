import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const { data: prof } = await supabase.from('profiles').select('balance, points_total').eq('id', userId).single()
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

    // 4. Add points + insert points_history with real order ID (prevents webhook double-processing)
    const currentPts = prof?.points_total ?? 0
    const earnRate   = currentPts >= 10000 ? 1 : currentPts >= 2500 ? 1 / 1.5 : 0.5
    const ptsEarned  = Math.floor(subtotal * earnRate)
    if (ptsEarned > 0) {
      const newTotal   = currentPts + ptsEarned
      const nextReward = [500, 1500, 4000, 8000].find(t => t > newTotal) ?? 0
      await supabase.from('points_history').insert({
        user_id: userId, points: ptsEarned, type: 'purchase',
        description: `Compra con saldo — ${items.map(i => i.name).join(', ')}`,
        order_id: shopifyOrderId,
      })
      await supabase.from('profiles').update({ points_total: newTotal, points_next_reward: nextReward }).eq('id', userId)
    }

    // 5. Save order in Supabase for "Mis pedidos"
    await supabase.from('orders').upsert({
      user_id: userId, shopify_order_id: shopifyOrderId, order_number: shopifyOrderId,
      total_price: subtotal, financial_status: 'paid', fulfillment_status: 'unfulfilled',
      line_items: items.map(i => ({ title: i.name, quantity: i.qty, price: String(i.price) })),
      created_at: new Date().toISOString(),
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
    return checkoutWithBalance(body.items, body.balanceToUse, body.userId)
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
