import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { CASILLERO } from '@/lib/shipping'
import { cookies } from 'next/headers'

async function requireAdmin() {
  const cookieStore = cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  return user && (await isAdmin(user.id)) ? user : null
}

type Perfil = { id: string; name: string; handle: string | null; email: string | null; whatsapp: string | null }
type Pedido = {
  id: string; order_number: string; user_id: string; created_at: string
  line_items: { title: string; quantity: number }[]
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [{ data: guardados }, { data: envios }] = await Promise.all([
    // Lo que está esperando en bodega, sin envío pedido todavía.
    admin.from('orders').select('id, order_number, user_id, line_items, created_at')
      .eq('carrier', CASILLERO).is('shipment_id', null)
      .order('created_at', { ascending: true }),
    // Envíos ya pagados que faltan por empacar y mandar.
    admin.from('shipments').select('*')
      .in('status', ['paid', 'shipped'])
      .order('created_at', { ascending: false }).limit(50),
  ])

  const userIds = Array.from(new Set([
    ...(guardados ?? []).map(o => o.user_id),
    ...(envios ?? []).map(s => s.user_id),
  ].filter(Boolean)))

  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, name, handle, email, whatsapp').in('id', userIds)
    : { data: [] as Perfil[] }
  const byId = new Map((profiles ?? []).map(p => [p.id, p]))

  // Un pedido suelto no sirve para empacar: lo que importa es qué tiene
  // guardado cada cliente y desde cuándo.
  const porCliente = new Map<string, { customer: Perfil | null; pedidos: Pedido[] }>()
  for (const o of (guardados ?? []) as Pedido[]) {
    const acc = porCliente.get(o.user_id)
      ?? { customer: byId.get(o.user_id) ?? null, pedidos: [] as Pedido[] }
    acc.pedidos.push(o)
    porCliente.set(o.user_id, acc)
  }

  const casilleros = Array.from(porCliente.entries()).map(([userId, v]) => {
    const masViejo = v.pedidos.reduce((min, p) =>
      new Date(p.created_at) < new Date(min) ? p.created_at : min, v.pedidos[0].created_at)
    return {
      userId,
      customer: v.customer,
      pedidos:  v.pedidos,
      piezas:   v.pedidos.reduce((s, p) => s + (p.line_items ?? []).reduce((n, li) => n + (li.quantity ?? 1), 0), 0),
      diasMasViejo: Math.floor((Date.now() - new Date(masViejo).getTime()) / 86_400_000),
    }
  }).sort((a, b) => b.diasMasViejo - a.diasMasViejo)

  // Qué va en cada caja que ya se pagó.
  const shipmentIds = (envios ?? []).map(s => s.id)
  const { data: enviados } = shipmentIds.length
    ? await admin.from('orders').select('id, order_number, shipment_id, line_items').in('shipment_id', shipmentIds)
    : { data: [] as { id: string; order_number: string; shipment_id: string; line_items: { title: string; quantity: number }[] }[] }

  const porEnvio = new Map<string, { title: string; quantity: number }[]>()
  for (const o of enviados ?? []) {
    porEnvio.set(o.shipment_id, [...(porEnvio.get(o.shipment_id) ?? []), ...(o.line_items ?? [])])
  }

  return NextResponse.json({
    casilleros,
    envios: (envios ?? []).map(s => ({
      ...s,
      customer: byId.get(s.user_id) ?? null,
      contenido: porEnvio.get(s.id) ?? [],
    })),
  })
}

/** Marca un envío como despachado y guarda la guía. */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { shipmentId, tracking } = await req.json() as { shipmentId?: string; tracking?: string }
  if (!shipmentId) return NextResponse.json({ error: 'Falta el envío' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('shipments')
    .update({ status: 'shipped', tracking_number: tracking?.trim() || null })
    .eq('id', shipmentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Los pedidos de esa caja ya salieron.
  await admin.from('orders')
    .update({ fulfillment_status: 'fulfilled', tracking_number: tracking?.trim() || null })
    .eq('shipment_id', shipmentId)

  return NextResponse.json({ ok: true })
}
