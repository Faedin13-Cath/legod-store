import { NextRequest, NextResponse } from 'next/server'
import { getProductByHandle } from '@/lib/shopify'
import { parsePreventa, amountsFor, type Modalidad } from '@/lib/preventa'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

type Seleccion = { handle: string; modalidad: Modalidad; qty?: number }

export async function POST(req: NextRequest) {
  const { items, userId, userEmail } = await req.json() as {
    items?: Seleccion[]; userId?: string; userEmail?: string
  }

  if (!items?.length) {
    return NextResponse.json({ error: 'No seleccionaste ninguna figura' }, { status: 400 })
  }
  if (!adminToken) {
    return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })
  }

  const lineItems: Record<string, unknown>[] = []
  const detalle: {
    id: string; name: string; modalidad: Modalidad
    qty: number; total: number; pagado: number; pendiente: number
  }[] = []

  let total = 0, pagadoHoy = 0, pendiente = 0

  for (const sel of items) {
    if (!sel?.handle) continue
    const modalidad: Modalidad = sel.modalidad === 'split' ? 'split' : 'completo'
    const qty = Math.max(1, Math.min(10, sel.qty ?? 1))

    // Los precios se leen de Shopify, nunca del cliente: si vinieran en el body
    // cualquiera podría pedir la figura por $1.
    const product = await getProductByHandle(sel.handle)
    if (!product) {
      return NextResponse.json({ error: `Producto no encontrado: ${sel.handle}` }, { status: 404 })
    }

    const pricing = parsePreventa(product.tags)
    if (!pricing) {
      return NextResponse.json({ error: `${product.title} no está en preventa` }, { status: 400 })
    }
    if (modalidad === 'split' && !pricing.split) {
      return NextResponse.json(
        { error: `${product.title} solo se puede pagar completa` },
        { status: 400 },
      )
    }

    // Stock real de Shopify. Llega null si el token no tiene el scope de
    // inventario; en ese caso no bloqueamos, solo dejamos pasar.
    const cantidades = product.variants.edges.map(e => e.node.quantityAvailable)
    if (cantidades.some(q => q !== null)) {
      const stock = cantidades.reduce<number>((s, q) => s + (q ?? 0), 0)
      if (stock <= 0) {
        return NextResponse.json({ error: `${product.title} ya se agotó` }, { status: 409 })
      }
      if (qty > stock) {
        return NextResponse.json(
          { error: `De ${product.title} solo ${stock === 1 ? 'queda 1' : `quedan ${stock}`}` },
          { status: 409 },
        )
      }
    }

    const a = amountsFor(pricing, modalidad)
    total     += a.total   * qty
    pagadoHoy += a.today   * qty
    pendiente += a.pending * qty

    lineItems.push({
      title: modalidad === 'completo'
        ? `${product.title} — Preventa (pago completo)`
        : `${product.title} — Preventa (anticipo)`,
      price:             a.today.toFixed(2),
      quantity:          qty,
      requires_shipping: false,
      taxable:           false,
    })

    detalle.push({
      id: sel.handle, name: product.title, modalidad, qty,
      total: a.total * qty, pagado: a.today * qty, pendiente: a.pending * qty,
    })
  }

  if (!lineItems.length) {
    return NextResponse.json({ error: 'No seleccionaste ninguna figura' }, { status: 400 })
  }

  const modalidades = Array.from(new Set(detalle.map(d => d.modalidad)))
  const modalidadPedido = modalidades.length > 1 ? 'mixta' : modalidades[0]

  const note = [
    'PREVENTA',
    ...detalle.map(d =>
      `• ${d.name} ×${d.qty} — ${d.modalidad === 'completo' ? 'pago completo' : 'anticipo'} $${d.pagado.toLocaleString('es-MX')}`
      + (d.pendiente > 0 ? ` (restan $${d.pendiente.toLocaleString('es-MX')})` : '')
    ),
    `Total: $${total.toLocaleString('es-MX')} MXN`,
    `Pagado hoy: $${pagadoHoy.toLocaleString('es-MX')} MXN`,
    ...(pendiente > 0 ? [`Pendiente al llegar: $${pendiente.toLocaleString('es-MX')} MXN`] : []),
  ].join('\n')

  const res = await fetch(`https://${domain}/admin/api/2024-01/draft_orders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: JSON.stringify({
      draft_order: {
        line_items: lineItems,
        note,
        tags: 'preventa',
        ...(userEmail ? { email: userEmail } : {}),
        note_attributes: [
          { name: 'tipo',            value: 'preventa' },
          { name: 'modalidad',       value: modalidadPedido },
          { name: 'preventa_total',  value: String(total) },
          { name: 'preventa_pagado', value: String(pagadoHoy) },
          { name: 'preventa_pend',   value: String(pendiente) },
          { name: 'original_items',  value: JSON.stringify(detalle) },
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
