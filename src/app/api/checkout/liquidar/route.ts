import { NextRequest, NextResponse } from 'next/server'

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
    }

    if (applied > 0) {
      draftOrder.applied_discount = {
        description: 'Saldo LEGOD',
        value_type:  'fixed_amount',
        value:        applied.toFixed(2),
        amount:       applied.toFixed(2),
        title:        'Saldo LEGOD',
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
