'use client'

import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

const AMOUNTS = [200, 300, 500, 1000, 1500, 2000]

export default function GiftCardsPage() {
  const { user, loading: authLoading } = useAuth()
  const [selected,    setSelected]    = useState(500)
  const [custom,      setCustom]      = useState('')
  const [recipient,   setRecipient]   = useState('')
  const [sending,     setSending]     = useState(false)
  const [error,       setError]       = useState('')
  const [sent,        setSent]        = useState(false)

  const finalAmount = custom ? parseInt(custom, 10) || 0 : selected

  async function handleBuy() {
    setError('')
    if (!recipient.trim()) { setError('Ingresa el correo o @usuario del destinatario'); return }
    if (finalAmount < 100)  { setError('El monto mínimo es $100 MXN'); return }
    setSending(true)
    try {
      const res  = await fetch('/api/balance/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalAmount, recipient: recipient.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al procesar'); return }
      if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank')
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: 'var(--accent)',
          }}>
            <Icon name="gift" size={28} />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>Gift cards</h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6, maxWidth: 480, marginInline: 'auto' }}>
            El regalo perfecto para cualquier fan de LEGO. Se acredita directamente al saldo de la cuenta del destinatario.
          </p>
        </div>

        {/* Require login */}
        {!authLoading && !user ? (
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 24, padding: '56px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 20 }}>
              Para enviar una gift card necesitas iniciar sesión.
            </div>
            <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
              Iniciar sesión
            </Link>
          </div>
        ) : !sent ? (
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 24, padding: '40px' }}>

            {/* Amount selector */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Elige el monto</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => { setSelected(a); setCustom('') }} style={{
                  padding: '16px', borderRadius: 12, fontSize: 18, fontWeight: 700,
                  background: selected === a && !custom ? 'var(--accent)' : 'var(--cream)',
                  color:      selected === a && !custom ? '#fff'          : 'var(--ink)',
                  border:     `1px solid ${selected === a && !custom ? 'var(--accent)' : 'var(--line)'}`,
                  cursor: 'pointer', transition: 'all .15s',
                }}>
                  ${a.toLocaleString('es-MX')}
                  <span style={{ fontSize: 11, fontWeight: 400, display: 'block', opacity: 0.7 }}>MXN</span>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
                O escribe un monto personalizado (mínimo $100 MXN)
              </label>
              <input
                type="number" min={100} placeholder="Ej. 750"
                value={custom} onChange={e => { setCustom(e.target.value); setSelected(0) }}
                className="input" style={{ maxWidth: 200 }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 28px' }} />

            {/* Recipient */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>¿Para quién es?</h3>
            <div style={{ marginBottom: 28, maxWidth: 400 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Correo o @usuario de LEGOD
              </label>
              <input
                type="text"
                placeholder="usuario@email.com o @legofan"
                value={recipient}
                onChange={e => { setRecipient(e.target.value); setError('') }}
                className="input" style={{ width: '100%' }}
              />
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 5 }}>
                El saldo se acreditará directamente a su cuenta de LEGOD.
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #F2BFBF', borderRadius: 10, fontSize: 13, color: '#A23030', marginBottom: 20 }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Total a pagar</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>
                  ${finalAmount >= 100 ? finalAmount.toLocaleString('es-MX') : '—'}
                  <small style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 4 }}>MXN</small>
                </div>
              </div>
              <button onClick={handleBuy} disabled={sending || finalAmount < 100} className="btn btn-primary"
                style={{ padding: '12px 32px', fontSize: 15, opacity: (sending || finalAmount < 100) ? 0.5 : 1 }}>
                {sending ? 'Procesando…' : 'Comprar gift card →'}
              </button>
            </div>
          </div>
        ) : (
          /* Success */
          <div style={{ background: 'var(--paper)', border: '1px solid #86EFAC', borderRadius: 24, padding: '56px 40px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#F0FBF4', border: '1px solid #86EFAC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#22C55E',
            }}>
              <Icon name="check" size={24} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>¡Listo!</h2>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 28px', lineHeight: 1.6 }}>
              El saldo se acreditará al destinatario en cuanto confirme el pago.
            </p>
            <button onClick={() => { setSent(false); setRecipient('') }} className="btn btn-secondary" style={{ marginRight: 12 }}>
              Enviar otra
            </button>
            <a href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none' }}>Seguir comprando</a>
          </div>
        )}

        {/* Info strips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32 }}>
          {[
            { icon: 'clock',   title: 'Sin vencimiento',     desc: 'El saldo no expira. El destinatario lo usa cuando quiera.' },
            { icon: 'shield',  title: 'Seguro y al instante', desc: 'Se acredita directamente en su cuenta LEGOD.' },
            { icon: 'sparkle', title: 'Para toda la tienda',  desc: 'Aplica en minifiguras, sets, promos y pedidos personalizados.' },
          ].map(b => (
            <div key={b.title} style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--paper)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ color: 'var(--accent)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', borderRadius: 8 }}>
                <Icon name={b.icon as never} size={16} />
              </span>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{b.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
