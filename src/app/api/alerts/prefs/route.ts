import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (pairs) => pairs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        ),
      },
    }
  )
}

export async function GET() {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('alert_prefs')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? { restock: true, pricedrop: false, drop: true, whatsapp: null })
}

export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const prefs = {
    user_id:   user.id,
    restock:   body.restock   ?? true,
    pricedrop: body.pricedrop ?? false,
    drop:      body.drop      ?? true,
    whatsapp:  body.whatsapp  ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('alert_prefs')
    .upsert(prefs, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
