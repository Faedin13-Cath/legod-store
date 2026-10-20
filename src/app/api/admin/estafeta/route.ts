import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { cookies } from 'next/headers'

// Encabezado EXACTO de la carga masiva de Estafeta (Multiguía)
const HEADER = [
  'nombre_destinatario','compania_destinatario','email_destinatario','telefono_destinatario',
  'calle_destinatario','numero_ext_destinatario','numero_int_destinatario','colonia_destinatario',
  'municipio_destinatario','codigo_postal_destinatario','estado_destinatario','pais_destinatario',
  'referencia_ubicacion','guardar_direccion_destino','contenido_paquete','unidad_longitud',
  'unidad_peso','ancho_paquete','alto_paquete','largo_paquete','cantidad','peso',
  'valor_declarado','solicitar_aseguranza',
]

type Ship = {
  name?: string; phone?: string; street?: string; numExt?: string; numInt?: string
  colonia?: string; city?: string; state?: string; zip?: string; ref?: string
}
type LineItem = { title?: string; quantity?: number }
type Contacto = { nombre: string | null; telefono: string | null; email: string | null }

// Una fila de la carga masiva: el orden sigue a HEADER y los defaults (MX, CM, KG,
// medidas, NO) viven solo aquí para que órdenes y entregas no se desfasen.
function guiaRow(g: {
  name: string; email: string; phone: string; street: string; numExt: string; numInt: string
  colonia: string; city: string; zip: string; state: string; ref: string
  contenido: string; cantidad: number; valor: string
}): string {
  return [
    g.name,                          // nombre_destinatario
    '',                              // compania_destinatario
    g.email,                         // email_destinatario
    g.phone,                         // telefono_destinatario
    g.street,                        // calle_destinatario
    g.numExt,                        // numero_ext_destinatario
    g.numInt,                        // numero_int_destinatario
    g.colonia,                       // colonia_destinatario
    g.city,                          // municipio_destinatario
    g.zip,                           // codigo_postal_destinatario
    g.state,                         // estado_destinatario
    'MX',                            // pais_destinatario
    g.ref,                           // referencia_ubicacion
    'NO',                            // guardar_direccion_destino
    g.contenido || 'Figura LEGO',    // contenido_paquete
    'CM',                            // unidad_longitud
    'KG',                            // unidad_peso
    '20',                            // ancho_paquete  (default, ajústalo)
    '15',                            // alto_paquete
    '25',                            // largo_paquete
    String(g.cantidad),              // cantidad
    '1',                             // peso (kg, default)
    g.valor,                         // valor_declarado
    'NO',                            // solicitar_aseguranza
  ].map(csvCell).join(',')
}

function csvResponse(lines: string[]) {
  const csv = '﻿' + lines.join('\r\n')  // BOM para acentos en Excel
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="estafeta_envios_${date}.csv"`,
    },
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function csvCell(v: unknown): string {
  // Anti inyección de fórmulas: Excel ejecuta las celdas que empiezan con = + - @ (los datos vienen del formulario público)
  const raw = String(v ?? '')
  // Un número o teléfono (p. ej. "+52 55 1234 5678") no es fórmula: se deja tal cual
  const esNumero = /^[+-]?[\d\s().-]+$/.test(raw.trim())
  const s = !esNumero && /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export async function GET(req: NextRequest) {
  // Solo el dueño puede exportar direcciones de clientes
  const cookieStore = cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Solo el administrador puede exportar' }, { status: 403 })
  }

  const scope = req.nextUrl.searchParams.get('scope') ?? 'pending'
  const admin = createAdminClient()

  // Entregas del formulario. Si viene `entregas=`, el CSV es SOLO de esas entregas:
  // nunca cae a las órdenes de la tienda, aunque la lista venga vacía o no coincida.
  const entregasParam = req.nextUrl.searchParams.get('entregas')
  if (entregasParam !== null) {
    const ids = Array.from(new Set(
      entregasParam.split(',').map(x => x.trim()).filter(x => UUID.test(x)),
    ))
    const lines = [HEADER.join(',')]
    if (ids.length) {
      const { data, error } = await admin
        .from('entregas')
        .select('recibe, direccion, piezas, resta, paqueteria, entrega_contactos(nombre, telefono, email)')
        .in('id', ids)
        .eq('tipo', 'envio')
        // Un conflicto es una identidad sin resolver (el contacto es otra persona): el dueño lo arregla a mano antes de enviar
        .neq('status', 'conflicto')
        .not('direccion', 'is', null)
        .order('created_at', { ascending: false })
      if (error) {
        return NextResponse.json({ error: 'No se pudieron leer las entregas' }, { status: 500 })
      }
      for (const e of data ?? []) {
        // Rock Show no lleva guía (tipo ya filtrado); aquí solo Estafeta
        if (!(e.paqueteria ?? '').toLowerCase().includes('estafeta')) continue
        const d = (e.direccion ?? {}) as Record<string, string | null>
        const rel = e.entrega_contactos as unknown as Contacto | Contacto[] | null
        const c: Contacto = (Array.isArray(rel) ? rel[0] : rel) ?? { nombre: null, telefono: null, email: null }
        lines.push(guiaRow({
          name: e.recibe || c.nombre || '',
          email: c.email ?? '',
          phone: c.telefono ?? '',
          street: d.calle ?? '', numExt: d.numExt ?? '', numInt: d.numInt ?? '',
          colonia: d.colonia ?? '', city: d.ciudad ?? '', zip: d.cp ?? '', state: d.estado ?? '',
          ref: d.referencia ?? '',
          contenido: String(e.piezas ?? '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).join(' | '),
          cantidad: 1,
          valor: String(e.resta ?? ''),
        }))
      }
    }
    return csvResponse(lines)
  }

  let query = admin
    .from('orders')
    .select('shipping, line_items, total_price, order_number, user_id, fulfillment_status, carrier')
    .not('shipping', 'is', null)
    .order('created_at', { ascending: false })

  if (scope === 'pending') query = query.neq('fulfillment_status', 'fulfilled')

  const { data: orders } = await query
  // Solo las órdenes que eligieron Estafeta (o sin paquetería definida → default)
  const rows = (orders ?? []).filter(o => {
    const c = (o.carrier ?? (o.shipping as { carrier?: string })?.carrier ?? '').toLowerCase()
    return c === '' || c.includes('estafeta')
  })

  // Emails por usuario (para email_destinatario)
  const emailBy: Record<string, string> = {}
  const ids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[]
  if (ids.length) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('id', ids)
    for (const p of profs ?? []) emailBy[p.id as string] = (p.email as string) ?? ''
  }

  const lines = [HEADER.join(',')]
  for (const o of rows) {
    const s = (o.shipping ?? {}) as Ship
    const items = (o.line_items ?? []) as LineItem[]
    const contenido = items.map(i => `${i.title ?? ''}${(i.quantity ?? 1) > 1 ? ` x${i.quantity}` : ''}`).join(' | ')
    const cantidad  = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0) || 1

    lines.push(guiaRow({
      name: s.name ?? '',
      email: emailBy[o.user_id as string] ?? '',
      phone: s.phone ?? '',
      street: s.street ?? '', numExt: s.numExt ?? '', numInt: s.numInt ?? '',
      colonia: s.colonia ?? '', city: s.city ?? '', zip: s.zip ?? '', state: s.state ?? '',
      ref: s.ref ?? '',
      contenido, cantidad,
      valor: String(o.total_price ?? ''),
    }))
  }

  return csvResponse(lines)
}
