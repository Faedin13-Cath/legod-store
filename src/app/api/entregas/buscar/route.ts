import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizarTelefono,
  enmascararCalle,
  enmascararColonia,
  enmascararCP,
  enmascararEmail,
  ipDe,
  type ContactoEnmascarado,
} from '@/lib/entregas'

// Endpoint público: no hay sesión ni contraseña, el celular es toda la llave.
// Por eso NUNCA sale de aquí la dirección completa, ningún id, ni una pista de
// en cuál tabla se encontró el dato. Todo se enmascara en el servidor.

const MAX_INTENTOS = 10      // por IP...
const VENTANA_SEG = 60       // ...en esta ventana
const LIMPIEZA_SEG = 3600    // los intentos más viejos se borran

type Datos = {
  nombre: string | null
  email: string | null
  calle: string | null
  numExt: string | null
  colonia: string | null
  cp: string | null
}

// Un solo constructor para las dos fuentes: la respuesta es idéntica
// venga de entrega_contactos o de profiles.
function enmascarar(d: Datos): ContactoEnmascarado {
  const calle = d.calle ?? ''
  const cp = d.cp ?? ''
  return {
    // Solo el nombre de pila: es lo que se saluda y lo único que hace falta.
    nombre: (d.nombre ?? '').trim().split(/\s+/)[0] ?? '',
    calle: enmascararCalle(calle, d.numExt ?? ''),
    colonia: enmascararColonia(d.colonia ?? ''),
    cp: enmascararCP(cp),
    email: enmascararEmail(d.email ?? ''),
    tieneDireccion: Boolean(calle && cp),
  }
}

export async function POST(req: NextRequest) {
  let body: { telefono?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const telefono = typeof body.telefono === 'string' ? normalizarTelefono(body.telefono) : null
  if (!telefono) {
    return NextResponse.json({ error: 'Celular inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Límite de intentos por IP (en tabla: un contador en memoria no sirve en Vercel) ──
  const ip = ipDe(req.headers)
  const ahora = Date.now()
  const { error: errInsert } = await supabase.from('entrega_intentos').insert({ ip })
  if (errInsert) {
    // Si no se puede contar, no se contesta: sin tope el endpoint sería un buscador de clientes.
    console.error('[entregas/buscar] no se pudo registrar el intento', errInsert.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
  // Limpieza oportunista; si falla no pasa nada.
  await supabase
    .from('entrega_intentos')
    .delete()
    .lt('created_at', new Date(ahora - LIMPIEZA_SEG * 1000).toISOString())
  const { count, error: errCount } = await supabase
    .from('entrega_intentos')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', new Date(ahora - VENTANA_SEG * 1000).toISOString())
  if (errCount || count === null) {
    console.error('[entregas/buscar] no se pudo contar intentos', errCount?.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
  if (count > MAX_INTENTOS) {
    return NextResponse.json({ error: 'Demasiados intentos, espera un minuto' }, { status: 429 })
  }

  // ── 1. Contactos del formulario ──
  const { data: contacto, error: errContacto } = await supabase
    .from('entrega_contactos')
    .select('nombre, email, calle, num_ext, colonia, cp')
    .eq('telefono', telefono)
    .maybeSingle()
  if (errContacto) {
    console.error('[entregas/buscar] contactos', errContacto.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
  if (contacto) {
    return NextResponse.json({
      contacto: enmascarar({
        nombre: contacto.nombre, email: contacto.email, calle: contacto.calle,
        numExt: contacto.num_ext, colonia: contacto.colonia, cp: contacto.cp,
      }),
    })
  }

  // ── 2. Perfiles de LEGOD ──
  // Los teléfonos están guardados en ~8 formatos distintos, así que no se puede
  // comparar en SQL. Se traen SOLO id y teléfonos (nunca nombres ni direcciones),
  // se normalizan aquí y únicamente del que coincida se lee la fila completa.
  // Se juntan TODAS las coincidencias: si dos perfiles comparten número no se
  // puede saber de quién es, y mostrar los datos de otra persona es peor que no reconocer a nadie.
  const coincidencias: string[] = []
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error: errPerfiles } = await supabase
      .from('profiles')
      .select('id, whatsapp, ship_phone')
      .order('id')
      .range(desde, desde + PAGINA - 1)
    if (errPerfiles) {
      console.error('[entregas/buscar] perfiles', errPerfiles.message)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }
    const perfiles = data ?? []
    for (const p of perfiles) {
      if (
        (p.whatsapp && normalizarTelefono(p.whatsapp) === telefono) ||
        (p.ship_phone && normalizarTelefono(p.ship_phone) === telefono)
      ) coincidencias.push(p.id)
    }
    if (perfiles.length < PAGINA) break
  }

  if (coincidencias.length > 1) {
    // Solo la cuenta: ni ids ni el número.
    console.error(`[entregas/buscar] ${coincidencias.length} perfiles comparten un mismo celular`)
    return NextResponse.json({ contacto: null })
  }

  if (coincidencias.length === 1) {
    const perfilId = coincidencias[0]
    const { data: p, error: errPerfil } = await supabase
      .from('profiles')
      .select('name, ship_name, email, ship_street, ship_num_ext, ship_colonia, ship_zip')
      .eq('id', perfilId)
      .maybeSingle()
    if (errPerfil) {
      console.error('[entregas/buscar] perfil', errPerfil.message)
      return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
    }
    if (p) {
      return NextResponse.json({
        contacto: enmascarar({
          nombre: p.name || p.ship_name, email: p.email, calle: p.ship_street,
          numExt: p.ship_num_ext, colonia: p.ship_colonia, cp: p.ship_zip,
        }),
      })
    }
  }

  return NextResponse.json({ contacto: null })
}
