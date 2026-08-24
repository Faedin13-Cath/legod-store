import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyOwner } from '@/lib/resend'

const BUCKET = 'sell-photos'

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  }

  const name        = String(form.get('name') ?? '').trim()
  const phone       = String(form.get('phone') ?? '').trim()
  const description = String(form.get('description') ?? '').trim()
  const payment     = String(form.get('payment') ?? '').trim()
  const files       = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)

  if (!name || !phone || !description) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Bucket (idempotente): lo crea la primera vez
  try {
    await supabase.storage.createBucket(BUCKET, { public: true })
  } catch { /* ya existe */ }

  // Subir fotos (máx 10)
  const photoUrls: string[] = []
  for (const file of files.slice(0, 10)) {
    const ext  = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const buf  = Buffer.from(await file.arrayBuffer())
    const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
      contentType: file.type || 'image/jpeg', upsert: false,
    })
    if (!error) {
      photoUrls.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
    }
  }

  const { error: insErr } = await supabase.from('sell_requests').insert({
    name, phone, description, payment, photos: photoUrls,
  })
  if (insErr) {
    console.error('[sell] insert error:', insErr)
    return NextResponse.json({ error: 'No se pudo guardar la solicitud' }, { status: 500 })
  }

  // Avisar a la tienda (si el correo está configurado; si no, queda en logs)
  await notifyOwner(
    `🧱 Nueva solicitud de venta — ${name}`,
    [
      `<strong>${name}</strong> quiere venderte piezas.`,
      `Teléfono: ${phone}`,
      `Pago preferido: ${payment || '—'}`,
      `Fotos: ${photoUrls.length}`,
      '',
      description.replace(/\n/g, '<br>'),
      '',
      ...photoUrls.map((u, i) => `<a href="${u}">Foto ${i + 1}</a>`),
      '',
      'Revísala en tu panel de Administración.',
    ].join('<br>'),
  )

  return NextResponse.json({ ok: true })
}
