import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { awardPurchasePoints } from '@/lib/loyalty'

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

type Shipping = {
  name: string; phone: string
  street: string; numExt?: string; numInt?: string
  colonia?: string; city: string; state: string; zip: string; ref?: string
}

function toShopifyAddress(s: Shipping) {
  const [first, ...rest] = s.name.trim().split(/\s+/)
  const address1 = [s.street, s.numExt].filter(Boolean).join(' ')
    + (s.numInt ? ` Int. ${s.numInt}` : '')
  return {
    first_name: first, last_name: rest.join(' ') || first,
    address1, address2: s.colonia ?? '',
    city: s.city, province: s.state, zip: s.zip,
    country: 'Mexico', phone: s.phone,
  }
}

export async function POST(req: NextRequest) {
  const { apartadoId, items, balance, subtotal, useBalance, balanceToUse, userId, shipping, userEmail } = await req.json() as {
    apartadoId:    string
    items:         { name: string; qty: number }[]
    balance:       number
    subtotal:      number
    useBalance?:   boolean
    balanceToUse?: number
    userId?:       string
    shipping?:     Shipping
    userEmail?:    string
  }

  if (!apartadoId || !balance) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const itemNames  = items.map(i => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')
  const applied    = (useBalance && balanceToUse && balanceToUse > 0) ? Math.min(balanceToUse, balance) : 0

  // Full saldo coverage — create + complete a Shopify order so it appears in
  // Admin (with customer + shipping), then settle balance/points here.
  if (applied >= balance && userId) {
    if (!shipping || !shipping.name || !shipping.street || !shipping.numExt || !shipping.city || !shipping.state || !shipping.zip) {
      return NextResponse.json({ error: 'Falta la dirección de envío', needShipping: true }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single()
    const currentBalance = prof?.balance ?? 0

    if (applied > currentBalance) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
    }

    // Guardar dirección en el perfil
    await supabase.from('profiles').update({
      ship_name: shipping.name, ship_phone: shipping.phone, ship_street: shipping.street,
      ship_num_ext: shipping.numExt ?? null, ship_num_int: shipping.numInt ?? null,
      ship_colonia: shipping.colonia ?? null, ship_city: shipping.city,
      ship_state: shipping.state, ship_zip: shipping.zip, ship_ref: shipping.ref ?? null,
    }).eq('id', userId)

    // Orden real en Shopify (liquidación pagada con saldo)
    let shopifyOrderId = `liquidacion_${apartadoId}`
    if (adminToken) {
      const draftRes = await adminFetch('/draft_orders.json', {
        method: 'POST',
        body: JSON.stringify({
          draft_order: {
            line_items: items.map(i => ({
              title: i.name, price: (balance / items.reduce((s, x) => s + x.qty, 0)).toFixed(2),
              quantity: i.qty, requires_shipping: true, taxable: false,
            })),
            applied_discount: {
              description: 'Saldo Jango\'s Store', value_type: 'fixed_amount',
              value: balance.toFixed(2), amount: balance.toFixed(2), title: 'Saldo Jango\'s Store',
            },
            ...(userEmail ? { email: userEmail } : {}),
            shipping_address: toShopifyAddress(shipping),
            note: `Liquidación de apartado con saldo — ${itemNames}`,
            tags: 'apartado,liquidacion,saldo',
            note_attributes: [
              { name: 'tipo',        value: 'liquidacion_saldo' },
              { name: 'apartado_id', value: apartadoId },
              { name: 'user_id',     value: userId },
            ],
          },
        }),
      })
      if (draftRes.ok) {
        const draftId = (await draftRes.json())?.draft_order?.id
        if (draftId) {
          const completeRes = await adminFetch(`/draft_orders/${draftId}/complete.json`, { method: 'PUT' })
          const orderId = (await completeRes.json())?.draft_order?.order_id
          if (orderId) shopifyOrderId = String(orderId)
        }
      } else {
        console.error('[liquidar saldo] draft error:', await draftRes.text())
      }
    }

    await supabase.from('apartados').update({ status: 'completed' }).eq('id', apartadoId)

    const newBalance = Math.max(0, currentBalance - applied)
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)
    await supabase.from('balance_transactions').insert({
      user_id:     userId,
      type:        'spent',
      amount:      applied,
      description: `Liquidación apartado — ${itemNames}`,
      reference_id: shopifyOrderId,
    })

    // Save to orders table so it appears in "Mis pedidos"
    await supabase.from('orders').upsert({
      user_id:            userId,
      shopify_order_id:   shopifyOrderId,
      order_number:       shopifyOrderId,
      total_price:        subtotal,
      financial_status:   'paid',
      fulfillment_status: 'unfulfilled',
      line_items:         items.map(i => ({ title: i.name, quantity: i.qty, price: String(subtotal / items.reduce((s, x) => s + x.qty, 0)) })),
      shipping,
      created_at:         new Date().toISOString(),
    }, { onConflict: 'shopify_order_id' })

    await awardPurchasePoints(supabase, {
      userId,
      amount:      balance,
      description: `Liquidación — ${itemNames}`,
      orderId:     shopifyOrderId,
    })

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
