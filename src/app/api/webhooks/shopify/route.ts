import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

async function adjustInventory(handle: string, qty: number) {
  if (!adminToken) return
  try {
    // 1. Find product by handle
    const pRes = await fetch(
      `https://${domain}/admin/api/2024-01/products.json?handle=${handle}&fields=id,variants`,
      { headers: { 'X-Shopify-Access-Token': adminToken } }
    )
    const pData  = await pRes.json()
    const variant = pData?.products?.[0]?.variants?.[0]
    if (!variant?.inventory_item_id) return

    // 2. Get inventory level to find location_id
    const iRes = await fetch(
      `https://${domain}/admin/api/2024-01/inventory_levels.json?inventory_item_ids=${variant.inventory_item_id}`,
      { headers: { 'X-Shopify-Access-Token': adminToken } }
    )
    const iData    = await iRes.json()
    const level    = iData?.inventory_levels?.[0]
    if (!level?.location_id) return

    // 3. Decrement available by qty
    await fetch(`https://${domain}/admin/api/2024-01/inventory_levels/adjust.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({
        location_id:          level.location_id,
        inventory_item_id:    variant.inventory_item_id,
        available_adjustment: -qty,
      }),
    })
  } catch (e) {
    console.error('[webhook] inventory adjust error for', handle, e)
  }
}

function verify(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  if (!secret) return false
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const topic  = req.headers.get('x-shopify-topic') ?? ''
  const hmac   = req.headers.get('x-shopify-hmac-sha256') ?? ''
  const body   = await req.text()

  if (!verify(body, hmac)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (topic !== 'orders/paid') {
    return NextResponse.json({ ok: true })
  }

  let order: {
    email?: string; total_price?: string; id?: string | number; order_number?: number
    note_attributes?: { name: string; value: string }[]
    line_items?: { title: string; price: string; quantity: number; variant_id?: number }[]
    created_at?: string
  }
  try { order = JSON.parse(body) } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const email       = order.email
  const totalPrice  = parseFloat(order.total_price ?? '0')
  const pointsToAdd = Math.floor(totalPrice)
  const orderId     = String(order.id ?? '')
  const orderNum    = order.order_number

  if (!email || pointsToAdd <= 0) {
    return NextResponse.json({ ok: true, skipped: 'no email or zero amount' })
  }

  const supabase = createAdminClient()

  // Find user by email in auth.users
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers()
  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!authUser) {
    // Customer not registered — skip silently
    return NextResponse.json({ ok: true, skipped: 'user not found' })
  }

  // Check for duplicate (same order already processed)
  const { data: existing } = await supabase
    .from('points_history')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: 'already processed' })

  // Add to points_history
  await supabase.from('points_history').insert({
    user_id:     authUser.id,
    points:      pointsToAdd,
    type:        'purchase',
    description: `Pedido #${orderNum ?? orderId}`,
    order_id:    orderId,
  })

  // Increment points_total on profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('points_total')
    .eq('id', authUser.id)
    .single()

  await supabase
    .from('profiles')
    .update({ points_total: (profile?.points_total ?? 0) + pointsToAdd })
    .eq('id', authUser.id)

  /* ── Apartado: create record if this is a deposit order ── */
  const attrs = order.note_attributes ?? []
  const attr  = (key: string) => attrs.find(a => a.name === key)?.value

  /* ── Liquidación: mark apartado as completed ── */
  if (attr('tipo') === 'liquidacion') {
    const apartadoId = attr('apartado_id')
    if (apartadoId) {
      await supabase
        .from('apartados')
        .update({ status: 'completed' })
        .eq('id', apartadoId)
    }
    return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
  }

  if (attr('tipo') === 'apartado') {
    const subtotal = parseInt(attr('subtotal_original') ?? '0', 10)
    const deposit  = parseInt(attr('anticipo_monto')    ?? '0', 10)
    const balance  = parseInt(attr('saldo_pendiente')   ?? '0', 10)
    const plazo    = attr('plazo_liquidar') ?? '15 días'

    const days = plazo.includes('semana') ? 7 : plazo.includes('mes') ? 30 : 15
    const deadline = new Date(order.created_at ?? Date.now())
    deadline.setDate(deadline.getDate() + days)

    // Parse original items (saved when draft order was created)
    let items: { id: string; name: string; price: number; qty: number }[] = []
    const originalItemsStr = attr('original_items')
    if (originalItemsStr) {
      try { items = JSON.parse(originalItemsStr) } catch { /* ignore */ }
    }
    if (!items.length) {
      // Fallback: derive from line_items (strips "— Apartado (40%)" suffix)
      items = (order.line_items ?? []).map(li => ({
        id:    li.title.toLowerCase().replace(/\s+/g, '-').replace(/—.*/,'').trim(),
        name:  li.title.replace(/\s*—.*$/, '').trim(),
        price: parseFloat(li.price) / 0.40,
        qty:   li.quantity,
      }))
    }

    if (subtotal > 0 && authUser) {
      await supabase.from('apartados').insert({
        user_id:    authUser.id,
        items,
        subtotal,
        deposit,
        balance,
        deadline_at: deadline.toISOString(),
        status:     'active',
      })
    }

    // Mark original products out of stock
    for (const item of items) {
      const handle = item.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      await adjustInventory(handle, item.qty)
    }
  }

  return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
}
