import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { cookies } from 'next/headers'
import { numerosOcupados, primerHueco } from '@/lib/entregas-numero'

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

export async function GET(req: NextRequest) {
  if (!(await esAdmin())) return noAutorizado()

  // Solo administrador: aquí sí se devuelve la dirección completa y el contacto embebido.
  // ?pendientes=1: todo lo que no está atendido, sin tope. Una bolsa pendiente
  // retiene su número aunque sea vieja, así que nunca debe quedar fuera de la lista.
  const soloPendientes = req.nextUrl.searchParams.get('pendientes') === '1'

  const admin = createAdminClient()
  let consulta = admin
    .from('entregas')
    .select(`
      id, created_at, numero, tipo, paqueteria, recibe, direccion, piezas, foto, resta, status,
      nombre_enviado, email_enviado,
      contacto:entrega_contactos ( id, nombre, telefono, email )
    `)
    .order('created_at', { ascending: false })
  consulta = soloPendientes ? consulta.neq('status', 'atendida') : consulta.limit(300)
  const { data, error } = await consulta

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

  const { data: fila, error: errLeer } = await admin
    .from('entregas').select('tipo, numero, status').eq('id', id).maybeSingle()
  if (errLeer) {
    console.error('[admin/entregas] leer', errLeer.message)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
  if (!fila) return NextResponse.json({ error: 'No existe esa entrega' }, { status: 404 })

  // Marcar atendida libera el número de bolsa solo (el índice único y la
  // búsqueda del hueco ignoran lo atendido), y la fila conserva cuál fue.
  // Regresarla a pendiente es lo delicado, y solo aplica si de verdad estaba
  // atendida: una fila ya pendiente tiene su bolsa marcada y no se renumera.
  const cambios: { status: string; numero?: number } = { status }
  let numeroFinal: number | null = null
  let renumerado = false
  if (status === 'nueva' && fila.tipo === 'rock_show' && fila.status === 'atendida') {
    const ocupados = await numerosOcupados(admin)
    if (ocupados === null) {
      return NextResponse.json({ error: 'No se pudo revisar qué números están libres. Intenta de nuevo.' }, { status: 500 })
    }
    // Se conserva su propio número si nadie más lo tiene: la bolsa física ya lo dice.
    if (fila.numero != null && !ocupados.includes(fila.numero)) {
      numeroFinal = fila.numero
    } else {
      numeroFinal = primerHueco(ocupados)
      cambios.numero = numeroFinal
      renumerado = true
    }
  }

  const { error } = await admin.from('entregas').update(cambios).eq('id', id)
  if (error) {
    if (error.code === '23505') {
      // Otro pedido tomó ese número justo ahora.
      return NextResponse.json({ error: 'Ese número se ocupó justo ahora. Intenta de nuevo.' }, { status: 409 })
    }
    console.error('[admin/entregas] actualizar', error.message)
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, numero: numeroFinal, renumerado })
}
