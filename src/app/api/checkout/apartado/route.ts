import { NextRequest, NextResponse } from 'next/server'

const domain      = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const adminToken  = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
const WHATSAPP    = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'
const DEPOSIT_PCT = 0.40

type CartLine = { id: string; name: string; price: number; qty: number }

function deadlineLabel(total: number) {
  if (total <= 1000) return '1 semana'
  if (total <= 4000) return '15 días'
  return '1 mes'
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
  const { items, subtotal, useBalance, balanceToUse, userId } = await req.json() as {
    items: CartLine[]; subtotal: number
    useBalance?: boolean; balanceToUse?: number; userId?: string
  }

  if (!items?.length || !subtotal) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const deposit = Math.round(subtotal * DEPOSIT_PCT)
  const balance = subtotal - deposit
  const plazo   = deadlineLabel(subtotal)

  const applied = (useBalance && balanceToUse && balanceToUse > 0 && userId)
    ? Math.min(balanceToUse, deposit)
    : 0

  /* ── Anticipo cubierto 100% con saldo → registrar apartado directo ──
     El anticipo con saldo genera una orden de $0 que Shopify no dispara de
     forma confiable, así que creamos el apartado y descontamos aquí. */
  if (applied >= deposit && userId) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data: prof } = await supabase.from('profiles').select('balance').eq('id', userId).single()
    const currentBalance = prof?.balance ?? 0
    if (applied > currentBalance) {
      return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 })
    }

    const deadline = new Date()
    deadline.setDate(deadline.getDate() + (plazo.includes('semana') ? 7 : plazo.includes('mes') ? 30 : 15))

    await supabase.from('apartados').insert({
      user_id:     userId,
      items:       items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal, deposit, balance,
      deadline_at: deadline.toISOString(),
      status:      'active',
    })

    const newBalance = Math.max(0, currentBalance - applied)
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId)
    await supabase.from('balance_transactions').insert({
      user_id: userId, type: 'spent', amount: applied,
      description: `Anticipo de apartado con saldo — ${items.map(i => i.name).join(', ')}`,
    })

    return NextResponse.json({ redirectUrl: '/apartados' })
  }

  /* ── Draft Order via Admin API (clean checkout, no "AHORRO TOTAL") ── */
  if (adminToken) {
    const lineItems = items.map(i => ({
      title:             `${i.name} — Apartado (${Math.round(DEPOSIT_PCT * 100)}%)`,
      price:             (i.price * DEPOSIT_PCT).toFixed(2),
      quantity:          i.qty,
      requires_shipping: false,
      taxable:           false,
    }))

    const originalItemsJson = JSON.stringify(
      items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
    )

    const note = [
      'APARTADO',
      `Total original: $${subtotal.toLocaleString('es-MX')} MXN`,
      `Anticipo (${Math.round(DEPOSIT_PCT * 100)}%): $${deposit.toLocaleString('es-MX')} MXN`,
      `Saldo pendiente: $${balance.toLocaleString('es-MX')} MXN`,
      `Plazo: ${plazo}`,
    ].join('\n')

    const draftOrder: Record<string, unknown> = {
      line_items: lineItems,
      note,
      tags: 'apartado',
      note_attributes: [
        { name: 'tipo',              value: 'apartado' },
        { name: 'subtotal_original', value: String(subtotal) },
        { name: 'anticipo_monto',    value: String(deposit) },
        { name: 'saldo_pendiente',   value: String(balance) },
        { name: 'plazo_liquidar',    value: plazo },
        { name: 'original_items',    value: originalItemsJson },
        ...(applied > 0 && userId
          ? [{ name: 'balance_used', value: String(applied) }, { name: 'user_id', value: userId }]
          : []),
      ],
    }

    // Saldo parcial: descuenta del anticipo; el webhook deduce el saldo al pagar.
    if (applied > 0) {
      draftOrder.applied_discount = {
        description: 'Saldo Jango\'s Store', value_type: 'fixed_amount',
        value: applied.toFixed(2), amount: applied.toFixed(2), title: 'Saldo Jango\'s Store',
      }
    }

    const res = await adminFetch('/draft_orders.json', {
      method: 'POST',
      body: JSON.stringify({ draft_order: draftOrder }),
    })

    if (res.ok) {
      const data       = await res.json()
      const invoiceUrl = data?.draft_order?.invoice_url
      if (invoiceUrl) return NextResponse.json({ checkoutUrl: invoiceUrl })
    } else {
      console.error('[apartado] Draft order error:', await res.text())
    }
  }

  /* ── Fallback: WhatsApp ── */
  const linesList = items
    .map(i => `• ${i.name}${i.qty > 1 ? ` x${i.qty}` : ''} — $${(i.price * i.qty).toLocaleString('es-MX')} MXN`)
    .join('\n')

  const msg = [
    '¡Hola! Me gustaría apartar las siguientes figuras:',
    '',
    linesList,
    '',
    `💰 Total: $${subtotal.toLocaleString('es-MX')} MXN`,
    `🏷️ Anticipo (${Math.round(DEPOSIT_PCT * 100)}%): $${deposit.toLocaleString('es-MX')} MXN`,
    `⏳ Plazo: ${plazo}`,
    '',
    '¿Me puedes enviar los datos para el pago?',
  ].join('\n')

  return NextResponse.json({
    checkoutUrl: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,
    via: 'whatsapp',
  })
}
