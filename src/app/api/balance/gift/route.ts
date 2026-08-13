import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'

const domain     = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

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

async function adminFetch(path: string, options: RequestInit = {}) {
  return fetch(`https://${domain}/admin/api/2024-01${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken!,
      ...((options.headers as Record<string, string>) ?? {}),
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, recipient } = await req.json() as { amount: number; recipient: string }
  if (!amount || amount < 100) {
    return NextResponse.json({ error: 'Monto inválido (mínimo $100)' }, { status: 400 })
  }
  if (!recipient?.trim()) {
    return NextResponse.json({ error: 'Destinatario requerido' }, { status: 400 })
  }

  const adminSupa = createAdminClient()
  let recipientId: string | null = null
  const recipientLabel = recipient.trim()

  if (recipientLabel.startsWith('@')) {
    const handle = recipientLabel.slice(1)
    const { data: profile } = await adminSupa
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .maybeSingle()
    recipientId = profile?.id ?? null
  } else {
    const { data: { users } } = await adminSupa.auth.admin.listUsers()
    const found = users.find(u => u.email?.toLowerCase() === recipientLabel.toLowerCase())
    recipientId = found?.id ?? null
  }

  if (!recipientId) {
    return NextResponse.json({ error: 'No encontramos a ese usuario en LEGOD' }, { status: 404 })
  }
  if (recipientId === user.id) {
    return NextResponse.json({ error: 'No puedes enviarte una gift card a ti mismo' }, { status: 400 })
  }

  if (!adminToken) {
    return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })
  }

  const res = await adminFetch('/draft_orders.json', {
    method: 'POST',
    body: JSON.stringify({
      draft_order: {
        line_items: [{
          title:             `Gift card LEGOD — $${amount.toLocaleString('es-MX')} MXN para ${recipientLabel}`,
          price:             amount.toFixed(2),
          quantity:          1,
          requires_shipping: false,
          taxable:           false,
        }],
        note: `Gift card de ${user.email} para ${recipientLabel}`,
        tags: 'saldo,gift',
        note_attributes: [
          { name: 'tipo',         value: 'gift' },
          { name: 'sender_id',    value: user.id },
          { name: 'recipient_id', value: recipientId },
          { name: 'amount',       value: String(amount) },
        ],
      },
    }),
  })

  if (!res.ok) {
    console.error('[gift] Draft order error:', await res.text())
    return NextResponse.json({ error: 'Error creando orden de pago' }, { status: 500 })
  }

  const data       = await res.json()
  const invoiceUrl = data?.draft_order?.invoice_url
  if (!invoiceUrl) return NextResponse.json({ error: 'No se obtuvo URL de pago' }, { status: 500 })

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}
