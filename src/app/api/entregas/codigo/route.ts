import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  normalizarTelefono, enmascararEmail, ipDe, CODIGO_VIGENCIA_MIN,
} from '@/lib/entregas'
import { generarCodigo, hashCodigo } from '@/lib/entregas-codigo'
import { registrarIntento } from '@/lib/entregas-limite'
import { sendCodigoEntregasEmail } from '@/lib/resend'

// Endpoint público: manda por correo el código que "Cambiar dirección" pide.
// Responde igual exista o no el contacto, salvo `sin_correo`, que el formulario
// necesita para mandar a WhatsApp. El código solo va al correo que YA estaba
// guardado: nunca a uno que mande quien lo pide.

const MAX_CODIGOS = 5           // por contacto, en la vigencia de un código: frena el correo-bomba
const BORRAR_DESPUES_SEG = 86400 // los códigos de más de un día se borran

export async function POST(req: NextRequest) {
  let body: { telefono?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }
  const telefono = typeof body.telefono === 'string' ? normalizarTelefono(body.telefono) : null
  if (!telefono) return NextResponse.json({ error: 'Celular inválido' }, { status: 400 })

  const supabase = createAdminClient()

  const limite = await registrarIntento(supabase, ipDe(req.headers), 'entregas/codigo')
  if (limite === 'error') return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  if (limite === 'tope') {
    return NextResponse.json({ error: 'Demasiados intentos, espera un minuto' }, { status: 429 })
  }

  const { data: contacto, error: errContacto } = await supabase
    .from('entrega_contactos').select('id, email').eq('telefono', telefono).maybeSingle()
  if (errContacto) {
    console.error('[entregas/codigo] contacto', errContacto.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }

  // Sin contacto se contesta como si se hubiera mandado, para no servir de buscador.
  if (!contacto) return NextResponse.json({ enviado: true, correo: '' })
  if (!contacto.email) return NextResponse.json({ enviado: false, motivo: 'sin_correo' })
  const correo = enmascararEmail(contacto.email)

  const ahora = Date.now()
  const vigencia = CODIGO_VIGENCIA_MIN * 60 * 1000

  // Tope por contacto. Pasado el tope se contesta igual que si se hubiera mandado
  // (los códigos anteriores siguen en su bandeja), sin mandar otro.
  const { count, error: errCount } = await supabase
    .from('entrega_codigos')
    .select('id', { count: 'exact', head: true })
    .eq('contacto_id', contacto.id)
    .gte('created_at', new Date(ahora - vigencia).toISOString())
  if (errCount || count === null) {
    console.error('[entregas/codigo] contar códigos', errCount?.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
  if (count >= MAX_CODIGOS) return NextResponse.json({ enviado: true, correo })

  // Limpieza oportunista; si falla no pasa nada.
  await supabase.from('entrega_codigos').delete()
    .lt('created_at', new Date(ahora - BORRAR_DESPUES_SEG * 1000).toISOString())

  // Un código nuevo anula los anteriores: así pedir otro no multiplica los intentos útiles.
  const { error: errAnula } = await supabase
    .from('entrega_codigos').update({ usado: true }).eq('contacto_id', contacto.id).eq('usado', false)
  if (errAnula) {
    console.error('[entregas/codigo] anular anteriores', errAnula.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }

  const codigo = generarCodigo()
  const { data: fila, error: errInsert } = await supabase
    .from('entrega_codigos')
    .insert({
      contacto_id: contacto.id,
      codigo_hash: hashCodigo(codigo),
      expira_at: new Date(ahora + vigencia).toISOString(),
    })
    .select('id')
    .single()
  if (errInsert || !fila) {
    console.error('[entregas/codigo] guardar código', errInsert?.message)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }

  try {
    const r = await sendCodigoEntregasEmail(contacto.email, codigo, CODIGO_VIGENCIA_MIN)
    if (r.error) throw new Error(r.error.message)
  } catch (e) {
    console.error('[entregas/codigo] no se pudo mandar el correo', e)
    // El código que no llegó no sirve de nada: se anula.
    await supabase.from('entrega_codigos').update({ usado: true }).eq('id', fila.id)
    return NextResponse.json({ error: 'No pudimos mandar el correo. Intenta de nuevo en un momento.' }, { status: 500 })
  }

  return NextResponse.json({ enviado: true, correo })
}
