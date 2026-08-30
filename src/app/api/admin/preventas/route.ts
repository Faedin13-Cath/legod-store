import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import { guardarEnCasillero } from '@/lib/casillero'
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

type ItemRow = { id: string; name: string; qty: number; pendiente: number }

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [{ data: preventas }, { data: arrivals }, productos] = await Promise.all([
    admin.from('preventas').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('preventa_arrivals').select('handle, arrived_at'),
    getProducts().then(ps => ps.map(shopifyToProduct).filter(p => p.preventa)).catch(() => []),
  ])

  const llegadas = new Map((arrivals ?? []).map(a => [a.handle, a.arrived_at]))

  // Cuántas unidades y cuánto dinero pendiente hay por figura, para saber qué
  // se libera al marcarla.
  const porFigura = new Map<string, { unidades: number; pendiente: number; clientes: number }>()
  for (const pv of preventas ?? []) {
    for (const it of (pv.items ?? []) as ItemRow[]) {
      if (!it?.id) continue
      const acc = porFigura.get(it.id) ?? { unidades: 0, pendiente: 0, clientes: 0 }
      acc.unidades  += it.qty ?? 0
      acc.pendiente += it.pendiente ?? 0
      if ((it.pendiente ?? 0) > 0) acc.clientes += 1
      porFigura.set(it.id, acc)
    }
  }

  const figuras = productos.map(p => ({
    handle:    p.id,
    name:      p.name,
    photo:     p.photo ?? null,
    stock:     p.stock,
    arrivedAt: llegadas.get(p.id) ?? null,
    ...(porFigura.get(p.id) ?? { unidades: 0, pendiente: 0, clientes: 0 }),
  }))

  // Detalle de clientes, para ver a quién le falta pagar qué.
  const userIds = Array.from(new Set((preventas ?? []).map(p => p.user_id).filter(Boolean)))
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, name, handle, email, whatsapp').in('id', userIds)
    : { data: [] as { id: string; name: string; handle: string | null; email: string | null; whatsapp: string | null }[] }
  const byId = new Map((profiles ?? []).map(p => [p.id, p]))

  return NextResponse.json({
    figuras,
    preventas: (preventas ?? []).map(p => ({ ...p, customer: byId.get(p.user_id) ?? null })),
  })
}

/** Marca (o desmarca) una figura como llegada. Aplica a todos sus apartados. */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { handle, arrived } = await req.json() as { handle?: string; arrived?: boolean }
  if (!handle) return NextResponse.json({ error: 'Falta la figura' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = arrived
    ? await admin.from('preventa_arrivals').upsert({ handle }, { onConflict: 'handle' })
    : await admin.from('preventa_arrivals').delete().eq('handle', handle)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Quien pagó la figura completa por adelantado no tiene saldo que liquidar,
  // así que nada dispararía su entrega. Al marcarla como llegada pasa directo
  // al casillero, listo para que pida el envío.
  let alCasillero = 0
  if (arrived) {
    const { data: preventas } = await admin
      .from('preventas')
      .select('id, user_id, items')
      .in('status', ['active', 'completed'])

    type Pieza = { id: string; name?: string; qty?: number; pendiente?: number }
    for (const pv of preventas ?? []) {
      const pieza = ((pv.items ?? []) as Pieza[]).find(i => i.id === handle)
      if (!pieza || (pieza.pendiente ?? 0) > 0) continue
      await guardarEnCasillero(admin, {
        userId:     pv.user_id,
        piezas:     [{ name: pieza.name ?? handle, qty: pieza.qty ?? 1 }],
        referencia: `preventa_${pv.id}_${handle}`,
      })
      alCasillero++
    }
  }

  return NextResponse.json({ ok: true, alCasillero })
}
