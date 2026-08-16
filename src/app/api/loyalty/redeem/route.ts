import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pts, saldo, label } = await req.json() as { pts: number; saldo: number; label: string }
  if (!pts || !saldo) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('points_total, balance')
    .eq('id', user.id)
    .single()

  if ((profile?.points_total ?? 0) < pts) {
    return NextResponse.json({ error: 'No tienes suficientes puntos' }, { status: 400 })
  }

  const newPoints  = (profile?.points_total ?? 0) - pts
  const newBalance = (profile?.balance      ?? 0) + saldo

  await admin.from('profiles').update({ points_total: newPoints, balance: newBalance }).eq('id', user.id)

  await admin.from('points_history').insert({
    user_id:     user.id,
    points:      pts,
    type:        'redeem',
    description: `Canje: ${label}`,
  })

  await admin.from('balance_transactions').insert({
    user_id:     user.id,
    type:        'topup',
    amount:      saldo,
    description: `Canje de puntos: ${label}`,
  })

  return NextResponse.json({ ok: true, newPoints, newBalance })
}
