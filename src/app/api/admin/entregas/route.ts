import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { cookies } from 'next/headers'
import { numeroLibre } from '@/lib/entregas-numero'

// Mismo patrón de validación que /api/admin/sell-requests.
async function esAdmin(): Promise<boolean> {
  const cookieStore = cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  return !!user && (await isAdmin(user.id))
}

const noAutorizado = () => NextResponse.json({ error: 'No autorizado' }, { status: 403 })

export async function GET() {
  if (!(await esAdmin())) return noAutorizado()

  // Solo administrador: aquí sí se devuelve la dirección completa y el contacto embebido.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('entregas')
    .select(`
      id, created_at, numero, tipo, paqueteria, recibe, direccion, piezas, foto, resta, status,
      nombre_enviado, email_enviado,
      contacto:entrega_contactos ( id, nombre, telefono, email )
    `)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) {
    console.error('[admin/entregas] leer', error.message)
    return NextResponse.json({ error: 'No se pudieron leer las entregas' }, { status: 500 })
  }
  return NextResponse.json({ entregas: data ?? [] })
}

// Marcar atendida (o regresarla a nueva). 'conflicto' no se asigna desde aquí.
export async function PATCH(req: NextRequest) {
  if (!(await esAdmin())) return noAutorizado()

  const body = await req.json().catch(() => null) as { id?: unknown; status?: unknown } | null
  const id = typeof body?.id === 'string' ? body.id : ''
  const status = body?.status
  if (!id || (status !== 'nueva' && status !== 'atendida')) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Marcar atendida libera el número de bolsa solo (el índice único y la
  // búsqueda del hueco ignoran lo atendido), y la fila conserva cuál fue.
  // Regresarla a pendiente es lo delicado: su número viejo puede estar ya
  // ocupado por otro pedido, así que se le da uno libre.
  const cambios: { status: string; numero?: number } = { status }
  if (status === 'nueva') {
    const { data: fila } = await admin
      .from('entregas').select('tipo, numero').eq('id', id).maybeSingle()
    if (fila?.tipo === 'rock_show') cambios.numero = await numeroLibre(admin)
  }

  const { error } = await admin.from('entregas').update(cambios).eq('id', id)
  if (error) {
    console.error('[admin/entregas] actualizar', error.message)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
