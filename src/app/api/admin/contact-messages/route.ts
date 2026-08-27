import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

const OWNER = (process.env.OWNER_EMAIL ?? 'faedin@hotmail.com').toLowerCase()

export async function GET() {
  const cookieStore = cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user || (user.email ?? '').toLowerCase() !== OWNER) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ messages: data ?? [] })
}
