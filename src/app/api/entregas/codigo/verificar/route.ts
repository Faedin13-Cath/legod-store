import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizarTelefono, ipDe } from '@/lib/entregas'
import { registrarIntento } from '@/lib/entregas-limite'
import { verificarCodigo } from '@/lib/entregas-codigo'

// Endpoint público: dice si el código que escribió el cliente es bueno, SIN gastarlo
// (el envío final vuelve a revisarlo y ahí sí se gasta). Un código malo cuenta como
// intento contra el tope de 5, y `restantes` le dice cuántos le quedan.

export async function POST(req: NextRequest) {
  let body: { telefono?: unknown; codigo?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }
  const telefono = typeof body.telefono === 'string' ? normalizarTelefono(body.telefono) : null
  const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : ''
  if (!telefono) return NextResponse.json({ error: 'Celular inválido' }, { status: 400 })

  const supabase = createAdminClient()

  const limite = await registrarIntento(supabase, ipDe(req.headers), 'entregas/codigo/verificar')
  if (limite === 'error') return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  if (limite === 'tope') {
    return NextResponse.json({ error: 'Demasiados intentos, espera un minuto' }, { status: 429 })
  }

  const { data: contacto, error } = await supabase
    .from('entrega_contactos').select('id').eq('telefono', telefono).maybeSingle()
  if (error) {
    console.error('[entregas/codigo/verificar] contacto', error.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
  // Sin contacto se contesta como un código agotado, para no servir de buscador.
  if (!contacto) return NextResponse.json({ valido: false, restantes: 0 })

  const r = await verificarCodigo(supabase, contacto.id, codigo)
  if (r.resultado === 'error') return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  return NextResponse.json({ valido: r.resultado === 'ok', restantes: r.restantes })
}
