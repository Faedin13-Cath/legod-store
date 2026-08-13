import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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

  const { amount } = await req.json() as { amount: number }
  if (!amount || amount < 100) {
    return NextResponse.json({ error: 'Monto inválido (mínimo $100)' }, { status: 400 })
  }

  if (!adminToken) {
    return NextResponse.json({ error: 'Sin configuración de pago' }, { status: 500 })
  }

  const res = await adminFetch('/draft_orders.json', {
    method: 'POST',
    body: JSON.stringify({
      draft_order: {
        line_items: [{
          title:             `Recarga de saldo LEGOD — $${amount.toLocaleString('es-MX')} MXN`,
          price:             amount.toFixed(2),
          quantity:          1,
          requires_shipping: false,
          taxable:           false,
        }],
        note: `Recarga de saldo para cuenta: ${user.email}`,
        tags: 'saldo,topup',
        note_attributes: [
          { name: 'tipo',    value: 'topup' },
          { name: 'user_id', value: user.id },
          { name: 'amount',  value: String(amount) },
        ],
      },
    }),
  })

  if (!res.ok) {
    console.error('[topup] Draft order error:', await res.text())
    return NextResponse.json({ error: 'Error creando orden de pago' }, { status: 500 })
  }

  const data       = await res.json()
  const invoiceUrl = data?.draft_order?.invoice_url
  if (!invoiceUrl) return NextResponse.json({ error: 'No se obtuvo URL de pago' }, { status: 500 })

  return NextResponse.json({ checkoutUrl: invoiceUrl })
}
