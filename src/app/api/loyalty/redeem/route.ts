import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { findReward, nextReward } from '@/lib/loyalty'
import { notifyOwner } from '@/lib/resend'

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

  const { pts } = await req.json() as { pts: number }

  // El cliente solo elige QUÉ recompensa. El saldo y la etiqueta salen de la
  // tabla del servidor — nunca del navegador.
  const reward = findReward(pts)
  if (!reward) {
    return NextResponse.json({ error: 'Recompensa no válida' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Canje atómico: la función descuenta solo si alcanzan los puntos,
  // así dos clics simultáneos no pueden canjear dos veces.
  const { data: result, error } = await admin.rpc('redeem_points', {
    p_user_id: user.id,
    p_pts:     reward.pts,
    p_saldo:   reward.saldo,
    p_label:   reward.label,
    p_ship:    reward.ship,
  })

  if (error) {
    console.error('[redeem] rpc error:', error)
    return NextResponse.json({ error: 'Error al canjear' }, { status: 500 })
  }

  if (!result?.ok) {
    const msg = result?.error === 'insufficient'
      ? 'No tienes suficientes puntos'
      : 'Canje no válido'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // El nivel no cambia al canjear (depende de points_lifetime), pero la
  // próxima recompensa alcanzable sí.
  await admin
    .from('profiles')
    .update({ points_next_reward: nextReward(result.points_total) })
    .eq('id', user.id)

  // Recompensa con envío físico: hay que avisarle a la tienda.
  if (reward.ship) {
    const { data: prof } = await admin
      .from('profiles').select('name, email, whatsapp').eq('id', user.id).single()

    await notifyOwner(
      `🎁 Canje con envío — ${reward.label}`,
      [
        `<strong>${prof?.name ?? 'Cliente'}</strong> canjeó ${reward.pts.toLocaleString('es-MX')} puntos.`,
        `Recompensa: <strong>${reward.label}</strong>`,
        `Email: ${prof?.email ?? user.email ?? '—'}`,
        `WhatsApp: ${prof?.whatsapp ?? '—'}`,
        '',
        'Hay que contactarlo para enviarle la figura sorpresa.',
      ].join('<br>'),
    )
  }

  return NextResponse.json({
    ok:         true,
    newPoints:  result.points_total,
    newBalance: result.balance,
  })
}
