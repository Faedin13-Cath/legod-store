import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardPurchasePoints } from '@/lib/loyalty'

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

  const email      = order.email
  const totalPrice = parseFloat(order.total_price ?? '0')
  const orderId    = String(order.id ?? '')
  const orderNum   = order.order_number

  if (!email) {
    return NextResponse.json({ ok: true, skipped: 'no email' })
  }

  const supabase = createAdminClient()

  // Find user by email — direct lookup instead of listing all users
  const { data: profileMatch } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  // Fallback: balance checkouts embed user_id in note_attributes
  const noteUserId = (order.note_attributes ?? []).find(a => a.name === 'user_id')?.value
  const resolvedId = profileMatch?.id ?? noteUserId

  if (!resolvedId) {
    return NextResponse.json({ ok: true, skipped: 'user not found' })
  }

  const authUser = { id: resolvedId }

  // Check for duplicate (same order already processed)
  const { data: existing } = await supabase
    .from('points_history')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: 'already processed' })

  // Parse note_attributes early — needed for points calculation
  const attrs = order.note_attributes ?? []
  const attr  = (key: string) => attrs.find(a => a.name === key)?.value
  const tipo  = attr('tipo')

  // Recargar saldo o comprar una gift card NO otorga puntos: los puntos se
  // ganan al gastar ese saldo. Contarlos aquí sería pagar dos veces.
  const earnsPoints = tipo !== 'topup' && tipo !== 'gift'

  // En compras con saldo, Shopify reporta el total ya descontado — hay que
  // sumar el descuento de vuelta para que los puntos reflejen el precio real.
  const balanceDiscount = tipo === 'compra' ? parseFloat(attr('balance_used') ?? '0') : 0
  const pointsBase      = totalPrice + balanceDiscount

  let pointsToAdd = 0
  if (earnsPoints) {
    const res = await awardPurchasePoints(supabase, {
      userId:      authUser.id,
      amount:      pointsBase,
      description: `Pedido #${orderNum ?? orderId}`,
      orderId,
    })
    pointsToAdd = res.total
  } else {
    // Sin puntos, pero dejamos la marca de idempotencia
    await supabase.from('points_history').insert({
      user_id: authUser.id, points: 0, type: 'purchase',
      description: `Pedido #${orderNum ?? orderId}`, order_id: orderId,
    })
  }

  // Save order to Supabase for "Mis pedidos"
  const fulfillment = (order as { fulfillments?: { tracking_number?: string; tracking_company?: string }[] }).fulfillments?.[0]

  // Snapshot de la dirección de Shopify → formato Estafeta para el export
  const sa = (order as { shipping_address?: {
    name?: string; first_name?: string; last_name?: string; phone?: string
    address1?: string; address2?: string; city?: string; province?: string; zip?: string
  } }).shipping_address
  const shipping = sa ? {
    name:   sa.name ?? [sa.first_name, sa.last_name].filter(Boolean).join(' '),
    phone:  sa.phone ?? '',
    street: sa.address1 ?? '', numExt: '', numInt: '',
    colonia: sa.address2 ?? '', city: sa.city ?? '',
    state:  sa.province ?? '', zip: sa.zip ?? '', ref: '',
  } : null

  await supabase.from('orders').upsert({
    user_id:            authUser.id,
    shopify_order_id:   orderId,
    order_number:       String(orderNum ?? orderId),
    total_price:        totalPrice,
    financial_status:   'paid',
    fulfillment_status: fulfillment ? 'fulfilled' : 'unfulfilled',
    tracking_number:    fulfillment?.tracking_number ?? null,
    carrier:            fulfillment?.tracking_company ?? null,
    line_items:         order.line_items ?? [],
    ...(shipping ? { shipping } : {}),
    created_at:         order.created_at ?? new Date().toISOString(),
  }, { onConflict: 'shopify_order_id' })

  /* ── Apartado: crea el registro en Supabase + descuenta saldo si se usó
     como parte del anticipo. Cubre tanto pedidos del checkout normal (sin
     saldo, o con saldo parcial) como pedidos creados a mano/por importación
     en Shopify Admin, siempre que el email del pedido coincida con una
     cuenta registrada (resolución por email arriba, sin depender de
     note_attributes). ── */
  if (attr('tipo') === 'apartado') {
    const subtotal    = parseInt(attr('subtotal_original') ?? '0', 10)
    const deposit     = parseInt(attr('anticipo_monto')    ?? '0', 10)
    const balance     = parseInt(attr('saldo_pendiente')   ?? '0', 10)
    const plazo       = attr('plazo_liquidar') ?? '15 días'
    const balanceUsed = parseInt(attr('balance_used') ?? '0', 10)

    let apItems: { id: string; name: string; price: number; qty: number }[] = []
    try { apItems = JSON.parse(attr('original_items') ?? '[]') } catch { /* cae al fallback de abajo */ }
    if (!apItems.length) {
      apItems = (order.line_items ?? []).map(li => ({
        id: li.title, name: li.title, price: parseFloat(li.price), qty: li.quantity,
      }))
    }

    const baseDate = order.created_at ? new Date(order.created_at) : new Date()
    const days     = plazo.includes('semana') ? 7 : plazo.includes('mes') ? 30 : 15
    const deadline = new Date(baseDate)
    deadline.setDate(deadline.getDate() + days)

    await supabase.from('apartados').insert({
      user_id:     authUser.id,
      items:       apItems,
      subtotal, deposit, balance,
      deadline_at: deadline.toISOString(),
      status:      'active',
    })

    if (balanceUsed > 0) {
      const { data: prof } = await supabase.from('profiles').select('balance').eq('id', authUser.id).single()
      const newBalance = Math.max(0, (prof?.balance ?? 0) - balanceUsed)
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', authUser.id)
      await supabase.from('balance_transactions').insert({
        user_id:      authUser.id,
        type:         'spent',
        amount:       balanceUsed,
        description:  `Anticipo de apartado con saldo — Orden #${orderNum ?? orderId}`,
        reference_id: orderId,
      })
    }

    return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
  }

  /* ── Preventa: registra la reserva. A diferencia del apartado no lleva
     fecha límite — el saldo (si lo hay) se liquida cuando la figura llega. ── */
  if (attr('tipo') === 'preventa') {
    const modalidad = attr('modalidad') === 'completo' ? 'completo' : 'split'
    const total     = parseInt(attr('preventa_total')  ?? '0', 10)
    const pagado    = parseInt(attr('preventa_pagado') ?? '0', 10)
    const pendiente = parseInt(attr('preventa_pend')   ?? '0', 10)

    let pvItems: { id: string; name: string; price: number; qty: number }[] = []
    try { pvItems = JSON.parse(attr('original_items') ?? '[]') } catch { /* usa el fallback */ }
    if (!pvItems.length) {
      pvItems = (order.line_items ?? []).map(li => ({
        id: li.title, name: li.title.replace(/\s*—.*$/, '').trim(),
        price: parseFloat(li.price), qty: li.quantity,
      }))
    }

    await supabase.from('preventas').insert({
      user_id:   authUser.id,
      items:     pvItems,
      modalidad, total, pagado, pendiente,
      status:    pendiente > 0 ? 'active' : 'completed',
      order_id:  orderId,
    })

    return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
  }

  /* ── Liquidación: mark apartado as completed + deduct balance if used ── */
  if (attr('tipo') === 'liquidacion') {
    const apartadoId  = attr('apartado_id')
    const balanceUsed = parseInt(attr('balance_used') ?? '0', 10)
    const userId      = attr('user_id')

    if (apartadoId) {
      await supabase.from('apartados').update({ status: 'completed' }).eq('id', apartadoId)
    }

    if (balanceUsed > 0 && userId) {
      const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single()
      const newBalance = Math.max(0, (prof?.balance ?? 0) - balanceUsed)
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)
      await supabase.from('balance_transactions').insert({
        user_id:      userId,
        type:         'spent',
        amount:       balanceUsed,
        description:  `Descuento en liquidación — Orden #${orderNum ?? orderId}`,
        reference_id: orderId,
      })
    }

    return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
  }

  if (attr('tipo') === 'compra') {
    const balanceUsed = parseFloat(attr('balance_used') ?? '0')
    const uid         = attr('user_id')

    if (balanceUsed > 0 && uid) {
      // Find the matching hold (most recent for this user + amount)
      const { data: hold } = await supabase
        .from('balance_transactions')
        .select('id, amount')
        .eq('user_id', uid)
        .eq('type', 'hold')
        .eq('amount', balanceUsed)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (hold) {
        const { data: userProf } = await supabase.from('profiles').select('balance').eq('id', uid).single()
        const newBalance = Math.max(0, (userProf?.balance ?? 0) - hold.amount)
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', uid)
        await supabase
          .from('balance_transactions')
          .update({ type: 'spent', description: `Saldo aplicado — Orden #${orderNum ?? orderId}`, reference_id: orderId })
          .eq('id', hold.id)
      }
    }

    return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
  }

  if (attr('tipo') === 'topup') {
    const amount = parseInt(attr('amount') ?? '0', 10)
    const userId = attr('user_id')
    if (amount > 0 && userId) {
      const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single()
      await supabase.from('profiles').update({ balance: (prof?.balance ?? 0) + amount }).eq('id', userId)
      await supabase.from('balance_transactions').insert({
        user_id:      userId,
        type:         'topup',
        amount,
        description:  `Recarga de saldo — Orden #${orderNum ?? orderId}`,
        reference_id: orderId,
      })
    }
    return NextResponse.json({ ok: true, pointsAdded: pointsToAdd })
  }

  if (attr('tipo') === 'gift') {
    const amount      = parseInt(attr('amount') ?? '0', 10)
    const senderId    = attr('sender_id')
    const recipientId = attr('recipient_id')
    if (amount > 0 && senderId && recipientId) {
      const { data: rProf } = await supabase.from('profiles').select('balance').eq('id', recipientId).single()
      await supabase.from('profiles').update({ balance: (rProf?.balance ?? 0) + amount }).eq('id', recipientId)
      await supabase.from('balance_transactions').insert([
        {
          user_id:      recipientId,
          type:         'gift_received',
          amount,
          description:  'Gift card recibida',
          reference_id: orderId,
        },
        {
          user_id:      senderId,
          type:         'gift_sent',
          amount,
          description:  `Gift card enviada — Orden #${orderNum ?? orderId}`,
          reference_id: orderId,
        },
      ])
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

    // Saldo parcial usado en el anticipo → descontarlo ahora
    const aptBalanceUsed = parseFloat(attr('balance_used') ?? '0')
    const aptUserId      = attr('user_id')
    if (aptBalanceUsed > 0 && aptUserId) {
      const { data: prof } = await supabase.from('profiles').select('balance').eq('id', aptUserId).single()
      const newBalance = Math.max(0, (prof?.balance ?? 0) - aptBalanceUsed)
      await supabase.from('profiles').update({ balance: newBalance }).eq('id', aptUserId)
      await supabase.from('balance_transactions').insert({
        user_id: aptUserId, type: 'spent', amount: aptBalanceUsed,
        description: `Saldo en anticipo de apartado — Orden #${orderNum ?? orderId}`,
        reference_id: orderId,
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
