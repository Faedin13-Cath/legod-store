import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdmin } from '@/lib/admin'
import { sendRestockEmail, sendNewArrivalEmail, notifyOwner } from '@/lib/resend'
import { cookies } from 'next/headers'
import fs from 'fs/promises'
import path from 'path'
import { Resend } from 'resend'

const FROM  = process.env.RESEND_FROM ?? 'Jango\'s Store <hola@jangos-store.com>'
const STORE = process.env.NEXT_PUBLIC_STORE_URL ?? 'https://jangos-store.com'

/**
 * Manda una copia de cada plantilla de correo al admin que lo pide, para
 * revisarlas en un cliente real (Gmail y Outlook rompen HTML que en el
 * navegador se ve perfecto).
 */
export async function POST() {
  const cookieStore = cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Falta RESEND_API_KEY' }, { status: 500 })
  }

  const to = user.email
  if (!to) return NextResponse.json({ error: 'Tu cuenta no tiene correo' }, { status: 400 })

  const enviados: string[] = []
  const fallidos: { plantilla: string; error: string }[] = []
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Plantillas de Supabase: viven como archivos porque el panel es su hogar
  // definitivo, pero así se pueden revisar antes de pegarlas allá.
  const auths = [
    { archivo: 'confirmar-cuenta.html',      asunto: '[Vista previa] Confirma tu correo' },
    { archivo: 'recuperar-contrasena.html',  asunto: '[Vista previa] Recupera tu contraseña' },
  ]

  for (const t of auths) {
    try {
      const ruta = path.join(process.cwd(), 'supabase', 'email-templates', t.archivo)
      const html = (await fs.readFile(ruta, 'utf8'))
        .replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, `${STORE}/login`)
      await resend.emails.send({ from: FROM, to, subject: t.asunto, html })
      enviados.push(t.archivo)
    } catch (e) {
      fallidos.push({ plantilla: t.archivo, error: e instanceof Error ? e.message : String(e) })
    }
  }

  try {
    await sendRestockEmail(to, 'Faedin', {
      name: 'Blade', handle: 'blade', price: 450,
      imageUrl: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0713.png',
    })
    enviados.push('restock')
  } catch (e) {
    fallidos.push({ plantilla: 'restock', error: e instanceof Error ? e.message : String(e) })
  }

  try {
    await sendNewArrivalEmail(to, 'Faedin', [
      { name: 'King Namor',                     handle: 'king-namor',            price: 250 },
      { name: 'Drax - Holiday Sweater',         handle: 'drax-holiday-sweater',  price: 100 },
      { name: 'Agent Phil Coulson - Black Tie', handle: 'agent-phil-coulson-black-tie', price: 500 },
    ])
    enviados.push('novedades')
  } catch (e) {
    fallidos.push({ plantilla: 'novedades', error: e instanceof Error ? e.message : String(e) })
  }

  try {
    await notifyOwner(
      '[Vista previa] Aviso a la tienda',
      'Así se ven los avisos internos: cuando alguien llena el formulario de '
      + 'contacto o manda una solicitud de venta, llega un correo con este formato.',
    )
    enviados.push('aviso interno')
  } catch (e) {
    fallidos.push({ plantilla: 'aviso interno', error: e instanceof Error ? e.message : String(e) })
  }

  return NextResponse.json({ to, enviados, fallidos })
}
