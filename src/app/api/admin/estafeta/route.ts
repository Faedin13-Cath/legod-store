import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

const OWNER = (process.env.OWNER_EMAIL ?? 'faedin@hotmail.com').toLowerCase()

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

function csvCell(v: unknown): string {
  const s = String(v ?? '')
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
  if (!user || (user.email ?? '').toLowerCase() !== OWNER) {
    return NextResponse.json({ error: 'Solo el administrador puede exportar' }, { status: 403 })
  }

  const scope = req.nextUrl.searchParams.get('scope') ?? 'pending'
  const admin = createAdminClient()

  let query = admin
    .from('orders')
    .select('shipping, line_items, total_price, order_number, user_id, fulfillment_status')
    .not('shipping', 'is', null)
    .order('created_at', { ascending: false })

  if (scope === 'pending') query = query.neq('fulfillment_status', 'fulfilled')

  const { data: orders } = await query
  const rows = orders ?? []

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

    lines.push([
      s.name ?? '',                    // nombre_destinatario
      '',                              // compania_destinatario
      emailBy[o.user_id as string] ?? '', // email_destinatario
      s.phone ?? '',                   // telefono_destinatario
      s.street ?? '',                  // calle_destinatario
      s.numExt ?? '',                  // numero_ext_destinatario
      s.numInt ?? '',                  // numero_int_destinatario
      s.colonia ?? '',                 // colonia_destinatario
      s.city ?? '',                    // municipio_destinatario
      s.zip ?? '',                     // codigo_postal_destinatario
      s.state ?? '',                   // estado_destinatario
      'MX',                            // pais_destinatario
      s.ref ?? '',                     // referencia_ubicacion
      'NO',                            // guardar_direccion_destino
      contenido || 'Figura LEGO',      // contenido_paquete
      'CM',                            // unidad_longitud
      'KG',                            // unidad_peso
      '20',                            // ancho_paquete  (default, ajústalo)
      '15',                            // alto_paquete
      '25',                            // largo_paquete
      String(cantidad),                // cantidad
      '1',                             // peso (kg, default)
      String(o.total_price ?? ''),     // valor_declarado
      'NO',                            // solicitar_aseguranza
    ].map(csvCell).join(','))
  }

  const csv = '﻿' + lines.join('\r\n')  // BOM para acentos en Excel
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="estafeta_envios_${date}.csv"`,
    },
  })
}
