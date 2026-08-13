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

type ShippingInfo = { tipo: 'pickup' | 'envio'; nombre: string; direccion: string; ciudad: string; estado: string; cp: string }

export async function POST(req: NextRequest) {
  const { apartadoId, items, balance, subtotal, shipping } = await req.json() as {
    apartadoId: string
    items: { name: string; qty: number }[]
    balance: number
    subtotal: number
    shipping?: ShippingInfo
  }

  if (!apartadoId || !balance) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const itemNames = items.map(i => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')

  if (adminToken) {
    const lineItems = items.map(i => ({
      title:             `${i.name} — Liquidación (60%)`,
      price:             (balance / items.reduce((s, x) => s + x.qty, 0)).toFixed(2),
      quantity:          i.qty,
      requires_shipping: false,
      taxable:           false,
    }))

    // Single line item for the balance is cleaner
    const res = await adminFetch('/draft_orders.json', {
      method: 'POST',
      body: JSON.stringify({
        draft_order: {
          line_items: [{
            title:             `Liquidación apartado — ${itemNames}`,
            price:             balance.toFixed(2),
            quantity:          1,
            requires_shipping: false,
            taxable:           false,
          }],
          note: [
            'LIQUIDACIÓN DE APARTADO',
            `Figuras: ${itemNames}`,
            `Total original: $${subtotal.toLocaleString('es-MX')} MXN`,
            `Saldo a pagar: $${balance.toLocaleString('es-MX')} MXN`,
            shipping?.tipo === 'envio'
              ? `\nEnvío a: ${shipping.nombre}, ${shipping.direccion}, ${shipping.ciudad} ${shipping.cp}, ${shipping.estado}`
              : '\nEntrega: Recoger en tienda',
          ].join('\n'),
          tags: 'apartado,liquidacion',
          note_attributes: [
            { name: 'tipo',        value: 'liquidacion' },
            { name: 'apartado_id', value: apartadoId },
          ],
        },
      }),
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
