import { NextRequest, NextResponse } from 'next/server'
import { getProductByHandle } from '@/lib/shopify'
import { parsePreventa } from '@/lib/preventa'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

type Modalidad = 'completo' | 'split'

export async function POST(req: NextRequest) {
  const { handle, modalidad, qty, userId, userEmail } = await req.json() as {
    handle?: string; modalidad?: Modalidad; qty?: number
    userId?: string; userEmail?: string
  }

  if (!handle || (modalidad !== 'completo' && modalidad !== 'split')) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (!adminToken) {
    return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })
  }

  // Los precios se leen de Shopify, nunca del cliente: si vinieran en el body
  // cualquiera podría pedir la figura por $1.
  const shopifyProduct = await getProductByHandle(handle)
  if (!shopifyProduct) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  const pricing = parsePreventa(shopifyProduct.tags)
  if (!pricing) {
    return NextResponse.json({ error: 'Este producto no está en preventa' }, { status: 400 })
  }

  const units    = Math.max(1, Math.min(5, qty ?? 1))
  const total    = (modalidad === 'completo' ? pricing.full : pricing.split) * units
  const cobrarHoy = (modalidad === 'completo' ? pricing.full : pricing.deposit) * units
  const pendiente = total - cobrarHoy

  const label = modalidad === 'completo'
    ? `${shopifyProduct.title} — Preventa (pago completo)`
    : `${shopifyProduct.title} — Preventa (${Math.round((pricing.deposit / pricing.split) * 100)}% de anticipo)`

  const note = [
    'PREVENTA',
    `Modalidad: ${modalidad === 'completo' ? 'Pago completo' : 'Anticipo + saldo al llegar'}`,
    `Total: $${total.toLocaleString('es-MX')} MXN`,
    `Pagado hoy: $${cobrarHoy.toLocaleString('es-MX')} MXN`,
    ...(pendiente > 0 ? [`Pendiente al llegar: $${pendiente.toLocaleString('es-MX')} MXN`] : []),
  ].join('\n')

  const items = [{ id: handle, name: shopifyProduct.title, price: total / units, qty: units }]

  const res = await fetch(`https://${domain}/admin/api/2024-01/draft_orders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: JSON.stringify({
      draft_order: {
        line_items: [{
          title:             label,
          price:             (cobrarHoy / units).toFixed(2),
          quantity:          units,
          requires_shipping: false,
          taxable:           false,
        }],
        note,
        tags: 'preventa',
        ...(userEmail ? { email: userEmail } : {}),
        note_attributes: [
          { name: 'tipo',            value: 'preventa' },
          { name: 'modalidad',       value: modalidad },
          { name: 'preventa_total',  value: String(total) },
          { name: 'preventa_pagado', value: String(cobrarHoy) },
          { name: 'preventa_pend',   value: String(pendiente) },
          { name: 'original_items',  value: JSON.stringify(items) },
          ...(userId ? [{ name: 'user_id', value: userId }] : []),
        ],
      },
    }),
  })

  if (!res.ok) {
    console.error('[preventa] draft order error:', await res.text())
    return NextResponse.json({ error: 'Error creando la orden' }, { status: 500 })
  }

  const data       = await res.json()
  const invoiceUrl = data?.draft_order?.invoice_url
  if (!invoiceUrl) {
    return NextResponse.json({ error: 'No se obtuvo URL de pago' }, { status: 500 })
  }

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}
