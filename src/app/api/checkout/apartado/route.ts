import { NextRequest, NextResponse } from 'next/server'

const domain      = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken  = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const WHATSAPP    = process.env.NEXT_PUBLIC_WHATSAPP ?? '5215512345678'
const DEPOSIT_PCT = 0.40

type CartLine = { id: string; name: string; price: number; qty: number }

function deadlineLabel(total: number) {
  if (total <= 1000) return '1 semana'
  if (total <= 4000) return '15 días'
  return '1 mes'
}

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
  const { items, subtotal }: { items: CartLine[]; subtotal: number } = await req.json()

  if (!items?.length || !subtotal) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const deposit = Math.round(subtotal * DEPOSIT_PCT)
  const balance = subtotal - deposit
  const plazo   = deadlineLabel(subtotal)

  /* ── Draft Order via Admin API (clean checkout, no "AHORRO TOTAL") ── */
  if (adminToken) {
    const lineItems = items.map(i => ({
      title:             `${i.name} — Apartado (${Math.round(DEPOSIT_PCT * 100)}%)`,
      price:             (i.price * DEPOSIT_PCT).toFixed(2),
      quantity:          i.qty,
      requires_shipping: false,
      taxable:           false,
    }))

    const originalItemsJson = JSON.stringify(
      items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
    )

    const note = [
      'APARTADO',
      `Total original: $${subtotal.toLocaleString('es-MX')} MXN`,
      `Anticipo (${Math.round(DEPOSIT_PCT * 100)}%): $${deposit.toLocaleString('es-MX')} MXN`,
      `Saldo pendiente: $${balance.toLocaleString('es-MX')} MXN`,
      `Plazo: ${plazo}`,
    ].join('\n')

    const res = await adminFetch('/draft_orders.json', {
      method: 'POST',
      body: JSON.stringify({
        draft_order: {
          line_items: lineItems,
          note,
          tags: 'apartado',
          note_attributes: [
            { name: 'tipo',              value: 'apartado' },
            { name: 'subtotal_original', value: String(subtotal) },
            { name: 'anticipo_monto',    value: String(deposit) },
            { name: 'saldo_pendiente',   value: String(balance) },
            { name: 'plazo_liquidar',    value: plazo },
            { name: 'original_items',    value: originalItemsJson },
          ],
        },
      }),
    })

    if (res.ok) {
      const data       = await res.json()
      const invoiceUrl = data?.draft_order?.invoice_url
      if (invoiceUrl) return NextResponse.json({ checkoutUrl: invoiceUrl })
    } else {
      console.error('[apartado] Draft order error:', await res.text())
    }
  }

  /* ── Fallback: WhatsApp ── */
  const linesList = items
    .map(i => `• ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''} — $${(i.price * i.qty).toLocaleString('es-MX')} MXN`)
    .join('\n')

  const msg = [
    '¡Hola! Me gustaría apartar las siguientes figuras:',
    '',
    linesList,
    '',
    `💰 Total: $${subtotal.toLocaleString('es-MX')} MXN`,
    `🏷️ Anticipo (${Math.round(DEPOSIT_PCT * 100)}%): $${deposit.toLocaleString('es-MX')} MXN`,
    `⏳ Plazo: ${plazo}`,
    '',
    '¿Me puedes enviar los datos para el pago?',
  ].join('\n')

  return NextResponse.json({
    checkoutUrl: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
    via: 'whatsapp',
  })
}
