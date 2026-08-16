import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const WHATSAPP   = process.env.NEXT_PUBLIC_WHATSAPP ?? '5215512345678'

async function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://${domain}/admin/api/2024-01${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken!,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })
}

export async function POST(req: NextRequest) {
  const { apartadoId, items, balance, subtotal, useBalance, balanceToUse, userId } = await req.json() as {
    apartadoId:    string
    items:         { name: string; qty: number }[]
    balance:       number
    subtotal:      number
    useBalance?:   boolean
    balanceToUse?: number
    userId?:       string
  }

  if (!apartadoId || !balance) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const itemNames  = items.map(i => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')
  const applied    = (useBalance && balanceToUse && balanceToUse > 0) ? Math.min(balanceToUse, balance) : 0

  // Full saldo coverage — bypass Shopify entirely (avoids $0 orders that may not fire webhooks)
  if (applied >= balance && userId) {
    const supabase = createAdminClient()
    const { data: prof } = await supabase.from('profiles').select('balance, points_total').eq('id', userId).single()
    const currentBalance = prof?.balance ?? 0

    if (applied > currentBalance) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
    }

    await supabase.from('apartados').update({ status: 'completed' }).eq('id', apartadoId)

    const newBalance = Math.max(0, currentBalance - applied)
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)
    await supabase.from('balance_transactions').insert({
      user_id:     userId,
      type:        'spent',
      amount:      applied,
      description: `Liquidación apartado — ${itemNames}`,
    })

    // Save to orders table so it appears in "Mis pedidos"
    const syntheticId = `liquidacion_${apartadoId}`
    await supabase.from('orders').upsert({
      user_id:            userId,
      shopify_order_id:   syntheticId,
      order_number:       syntheticId,
      total_price:        subtotal,
      financial_status:   'paid',
      fulfillment_status: 'unfulfilled',
      line_items:         items.map(i => ({ title: i.name, quantity: i.qty, price: String(subtotal / items.reduce((s, x) => s + x.qty, 0)) })),
      created_at:         new Date().toISOString(),
    }, { onConflict: 'shopify_order_id' })

    const currentPts = prof?.points_total ?? 0
    const earnRate   = currentPts >= 10000 ? 1 : currentPts >= 2500 ? 1 / 1.5 : 0.5
    const ptsEarned  = Math.floor(balance * earnRate)
    if (ptsEarned > 0) {
      const newTotal   = currentPts + ptsEarned
      const nextReward = [500, 1500, 4000, 8000].find(t => t > newTotal) ?? 0
      await supabase.from('points_history').insert({
        user_id:     userId,
        points:      ptsEarned,
        type:        'purchase',
        description: `Liquidación — ${itemNames}`,
        order_id:    syntheticId,
      })
      await supabase.from('profiles').update({ points_total: newTotal, points_next_reward: nextReward }).eq('id', userId)
    }

    return NextResponse.json({ redirectUrl: '/pedidos' })
  }

  if (adminToken) {
    const noteAttrs: { name: string; value: string }[] = [
      { name: 'tipo',        value: 'liquidacion' },
      { name: 'apartado_id', value: apartadoId },
    ]
    if (applied > 0 && userId) {
      noteAttrs.push({ name: 'balance_used', value: String(applied) })
      noteAttrs.push({ name: 'user_id',      value: userId })
    }

    const draftOrder: Record<string, unknown> = {
      line_items: [{
        title:             `Liquidación apartado — ${itemNames}`,
        price:             balance.toFixed(2),
        quantity:          1,
        requires_shipping: true,
        taxable:           false,
      }],
      note: [
        'LIQUIDACIÓN DE APARTADO',
        `Figuras: ${itemNames}`,
        `Total original: $${subtotal.toLocaleString('es-MX')} MXN`,
        `Saldo a pagar: $${balance.toLocaleString('es-MX')} MXN`,
        ...(applied > 0 ? [`Descuento saldo: $${applied.toLocaleString('es-MX')} MXN`] : []),
      ].join('\n'),
      tags:            'apartado,liquidacion',
      note_attributes: noteAttrs,
      redirect_url:    'https://legod-store-2.vercel.app/apartados',
    }

    if (applied > 0) {
      draftOrder.applied_discount = {
        description: 'Saldo Jango\'s Store',
        value_type:  'fixed_amount',
        value:        applied.toFixed(2),
        amount:       applied.toFixed(2),
        title:        'Saldo Jango\'s Store',
      }
    }

    const res = await adminFetch('/draft_orders.json', {
      method: 'POST',
      body: JSON.stringify({ draft_order: draftOrder }),
    })

    if (res.ok) {
      const data       = await res.json()
      const invoiceUrl = data?.draft_order?.invoice_url
      if (invoiceUrl) return NextResponse.json({ checkoutUrl: invoiceUrl })
    } else {
      console.error('[liquidar] Draft order error:', await res.text())
    }
  }

  // Fallback: WhatsApp
  const msg = [
    '¡Hola! Quiero liquidar el saldo de mi apartado:',
    '',
    `📦 ${itemNames}`,
    '',
    `🏷️ Saldo pendiente: $${balance.toLocaleString('es-MX')} MXN`,
    '',
    '¿Cómo procedo?',
  ].join('\n')

  return NextResponse.json({
    checkoutUrl: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
    via: 'whatsapp',
  })
}
