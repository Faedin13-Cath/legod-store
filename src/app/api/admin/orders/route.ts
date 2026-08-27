import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { cookies } from 'next/headers'

export async function GET() {
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

  const admin = createAdminClient()
  const { data: orders } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)

  const userIds = Array.from(new Set((orders ?? []).map(o => o.user_id).filter(Boolean)))
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, name, handle, email').in('id', userIds)
    : { data: [] as { id: string; name: string; handle: string | null; email: string | null }[] }
  const byId = new Map((profiles ?? []).map(p => [p.id, p]))

  const enriched = (orders ?? []).map(o => ({
    ...o,
    customer: byId.get(o.user_id) ?? null,
  }))

  return NextResponse.json({ orders: enriched })
}
