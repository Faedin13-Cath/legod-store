import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendRestockEmail } from '@/lib/resend'

const STORE = process.env.NEXT_PUBLIC_STORE_URL ?? 'https://jangos-store.com'

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { product } = await req.json() as {
    product: { name: string; handle: string; price: number; imageUrl?: string }
  }

  if (!product?.name || !product?.handle) {
    return NextResponse.json({ error: 'Missing product' }, { status: 400 })
  }

  // Get all users with restock alerts enabled
  const { data: prefs } = await supabase
    .from('alert_prefs')
    .select('user_id, whatsapp')
    .eq('restock', true)

  if (!prefs || prefs.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers' })
  }

  const userIds = prefs.map(p => p.user_id)

  // Fetch emails from auth.users via service role
  const { data: users } = await supabase.auth.admin.listUsers()
  const relevantUsers = (users?.users ?? []).filter(u => userIds.includes(u.id))

  const results: { email: string; status: string }[] = []
  const waLinks: string[] = []

  for (const u of relevantUsers) {
    const email = u.email
    const name  = (u.user_metadata?.full_name ?? u.user_metadata?.name ?? email?.split('@')[0] ?? 'amigo') as string
    const pref  = prefs.find(p => p.user_id === u.id)

    if (email) {
      try {
        await sendRestockEmail(email, name, product)
        results.push({ email, status: 'sent' })
      } catch (e) {
        results.push({ email, status: 'error: ' + String(e) })
      }
    }

    // Build wa.me link for Jango to send manually
    if (pref?.whatsapp) {
      const msg = [
        `¡Hola ${name}! 👋 Tengo buenas noticias:`,
        ``,
        `*${product.name}* está de vuelta en stock 🔔`,
        ``,
        `$${product.price.toLocaleString('es-MX')} MXN`,
        `👉 ${STORE}/tienda/${product.handle}`,
      ].join('\n')
      waLinks.push(`https://wa.me/${pref.whatsapp}?text=${encodeURIComponent(msg)}`)
    }
  }

  return NextResponse.json({
    sent: results.filter(r => r.status === 'sent').length,
    total: results.length,
    results,
    waLinks,
  })
}
