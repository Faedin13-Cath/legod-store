import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { shippingCost, CASILLERO, CARRIERS_ENVIO } from '@/lib/shipping'
import { cookies } from 'next/headers'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

async function currentUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Lo que el cliente tiene guardado y aún no se le ha mandado. */
export async function GET() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: guardados }, { data: envios }] = await Promise.all([
    admin.from('orders').select('*')
      .eq('user_id', user.id).eq('carrier', CASILLERO).is('shipment_id', null)
      .order('created_at', { ascending: true }),
    admin.from('shipments').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({ guardados: guardados ?? [], envios: envios ?? [] })
}

type Shipping = {
  name: string; phone: string
  street?: string; numExt?: string; numInt?: string
  colonia?: string; city?: string; state?: string; zip?: string; ref?: string
}

/** Pide que le manden lo guardado: cobra el envío una sola vez. */
export async function POST(req: NextRequest) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderIds, carrier, shipping } = await req.json() as {
    orderIds?: string[]; carrier?: string; shipping?: Shipping
  }

  if (!carrier || !(CARRIERS_ENVIO as readonly string[]).includes(carrier)) {
    return NextResponse.json({ error: 'Elige una paquetería' }, { status: 400 })
  }
  if (!shipping?.name?.trim() || !shipping?.phone?.trim() ||
      !shipping.street?.trim() || !shipping.numExt?.trim() ||
      !shipping.city?.trim() || !shipping.state?.trim() || !shipping.zip?.trim()) {
    return NextResponse.json({ error: 'Falta la dirección de envío' }, { status: 400 })
  }
  if (!adminToken) {
    return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })
  }

  const admin = createAdminClient()

  // Qué se manda: lo que el cliente eligió, o todo lo guardado si no eligió.
  // Se relee de la base para no confiar en lo que mande el navegador.
  let q = admin.from('orders').select('id, order_number, line_items')
    .eq('user_id', user.id).eq('carrier', CASILLERO).is('shipment_id', null)
  if (orderIds?.length) q = q.in('id', orderIds)
  const { data: piezas } = await q

  if (!piezas?.length) {
    return NextResponse.json({ error: 'No tienes nada guardado para enviar' }, { status: 409 })
  }

  const costo = shippingCost(carrier)

  const { data: envio, error } = await admin.from('shipments').insert({
    user_id: user.id, carrier, cost: costo, shipping, status: 'pending',
  }).select('id').single()

  if (error || !envio) {
    return NextResponse.json({ error: 'No se pudo registrar el envío' }, { status: 500 })
  }

  const resumen = piezas
    .flatMap(p => (p.line_items ?? []) as { title: string; quantity: number }[])
    .map(li => `${li.title}${li.quantity > 1 ? ` x${li.quantity}` : ''}`)

  const res = await fetch(`https://${domain}/admin/api/2024-01/draft_orders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
    body: JSON.stringify({
      draft_order: {
        line_items: [{
          title:             `Envío de casillero (${carrier}) — ${piezas.length} ${piezas.length === 1 ? 'pedido' : 'pedidos'}`,
          price:             costo.toFixed(2),
          quantity:          1,
          requires_shipping: false,
          taxable:           false,
        }],
        note: [
          'ENVÍO DE CASILLERO',
          `Paquetería: ${carrier}`,
          `Pedidos incluidos: ${piezas.map(p => `#${p.order_number}`).join(', ')}`,
          ...(resumen.length ? [`Contenido: ${resumen.join(', ')}`] : []),
        ].join('\n'),
        tags: 'casillero,envio',
        ...(user.email ? { email: user.email } : {}),
        shipping_address: {
          first_name: shipping.name.trim().split(/\s+/)[0],
          last_name:  shipping.name.trim().split(/\s+/).slice(1).join(' ') || shipping.name.trim(),
          address1:   [shipping.street, shipping.numExt].filter(Boolean).join(' ')
                      + (shipping.numInt ? ` Int. ${shipping.numInt}` : ''),
          address2:   shipping.colonia ?? '',
          city:       shipping.city,
          province:   shipping.state,
          zip:        shipping.zip,
          country:    'Mexico',
          phone:      shipping.phone,
        },
        redirect_url: 'https://jangos-store.com/casillero',
        note_attributes: [
          { name: 'tipo',        value: 'casillero_envio' },
          { name: 'shipment_id', value: envio.id },
          { name: 'user_id',     value: user.id },
          { name: 'order_ids',   value: JSON.stringify(piezas.map(p => p.id)) },
        ],
      },
    }),
  })

  if (!res.ok) {
    console.error('[casillero] draft error:', await res.text())
    await admin.from('shipments').delete().eq('id', envio.id)
    return NextResponse.json({ error: 'Error creando el cobro del envío' }, { status: 500 })
  }

  const invoiceUrl = (await res.json())?.draft_order?.invoice_url
  if (!invoiceUrl) {
    await admin.from('shipments').delete().eq('id', envio.id)
    return NextResponse.json({ error: 'No se obtuvo URL de pago' }, { status: 500 })
  }

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}
