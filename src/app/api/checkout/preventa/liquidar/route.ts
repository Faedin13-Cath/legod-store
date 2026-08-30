import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const WHATSAPP   = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'

type Item = { id: string; name: string; qty: number; pendiente: number }

export async function POST(req: NextRequest) {
  const { preventaId, userId, userEmail } = await req.json() as {
    preventaId?: string; userId?: string; userEmail?: string
  }

  if (!preventaId || !userId) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  // El monto sale de la base, no del cliente: mandarlo en el body dejaría que
  // cualquiera liquidara su preventa por $1.
  const supabase = createAdminClient()
  const { data: pv } = await supabase
    .from('preventas')
    .select('id, user_id, items, pendiente, status')
    .eq('id', preventaId)
    .single()

  if (!pv)                    return NextResponse.json({ error: 'Preventa no encontrada' }, { status: 404 })
  if (pv.user_id !== userId)  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (pv.status !== 'active') return NextResponse.json({ error: 'Esta preventa ya no está activa' }, { status: 400 })

  const items = (pv.items ?? []) as Item[]

  const { data: arrivals } = await supabase.from('preventa_arrivals').select('handle')
  const llegadas = new Set((arrivals ?? []).map(a => a.handle))

  // Solo se cobra lo que ya está en la tienda. Lo que no ha llegado sigue
  // esperando, aunque venga en el mismo apartado.
  const cobrables = items.filter(i => (i.pendiente ?? 0) > 0 && llegadas.has(i.id))
  if (!cobrables.length) {
    return NextResponse.json(
      { error: 'Todavía no hay nada por cobrar: tus figuras aún no llegan.' },
      { status: 409 },
    )
  }

  const monto     = cobrables.reduce((s, i) => s + i.pendiente, 0)
  const itemNames = cobrables.map(i => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')
  const handles   = cobrables.map(i => i.id)

  if (adminToken) {
    const res = await fetch(`https://${domain}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
      body: JSON.stringify({
        draft_order: {
          line_items: cobrables.map(i => ({
            title:             `Saldo de preventa — ${i.name}`,
            price:             i.pendiente.toFixed(2),
            quantity:          1,
            requires_shipping: true,
            taxable:           false,
          })),
          note: [
            'LIQUIDACIÓN DE PREVENTA',
            `Figuras que ya llegaron: ${itemNames}`,
            `Saldo a pagar: $${monto.toLocaleString('es-MX')} MXN`,
          ].join('\n'),
          tags: 'preventa,liquidacion',
          ...(userEmail ? { email: userEmail } : {}),
          redirect_url: 'https://jangos-store.com/mis-preventas',
          note_attributes: [
            { name: 'tipo',        value: 'preventa_liquidacion' },
            { name: 'preventa_id', value: preventaId },
            { name: 'user_id',     value: userId },
            { name: 'handles',     value: JSON.stringify(handles) },
          ],
        },
      }),
    })

    if (res.ok) {
      const invoiceUrl = (await res.json())?.draft_order?.invoice_url
      if (invoiceUrl) return NextResponse.json({ checkoutUrl: invoiceUrl })
    } else {
      console.error('[preventa liquidar] draft error:', await res.text())
    }
  }

  const msg = [
    '¡Hola! Quiero pagar el saldo de mi preventa:',
    '',
    `📦 ${itemNames}`,
    '',
    `🏷️ Saldo pendiente: $${monto.toLocaleString('es-MX')} MXN`,
    '',
    '¿Cómo procedo?',
  ].join('\n')

  return NextResponse.json({
    checkoutUrl: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
    via: 'whatsapp',
  })
}
