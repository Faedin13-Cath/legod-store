import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOwner } from '@/lib/resend'

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; subject?: string; msg?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const name    = String(body.name ?? '').trim()
  const email   = String(body.email ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const message = String(body.msg ?? '').trim()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error: insErr } = await supabase.from('contact_messages').insert({
    name, email, subject: subject || null, message,
  })
  if (insErr) {
    console.error('[contact] insert error:', insErr)
    return NextResponse.json({ error: 'No se pudo enviar el mensaje' }, { status: 500 })
  }

  await notifyOwner(
    `✉️ Nuevo mensaje de contacto — ${name}`,
    [
      `<strong>${name}</strong> (${email}) escribió:`,
      subject ? `<br><em>Asunto: ${subject}</em>` : '',
      `<p style="white-space:pre-wrap">${message}</p>`,
    ].join(''),
  )

  return NextResponse.json({ ok: true })
}
