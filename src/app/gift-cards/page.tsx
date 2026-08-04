'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const AMOUNTS = [200, 300, 500, 1000, 1500, 2000]

export default function GiftCardsPage() {
  const [selected, setSelected] = useState(500)
  const [custom,   setCustom]   = useState('')
  const [sent,     setSent]     = useState(false)

  const finalAmount = custom ? parseInt(custom, 10) || 0 : selected

  function handleBuy() {
    if (finalAmount >= 100) setSent(true)
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
            <Icon name="sparkle" size={28} />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>
            Gift cards
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6, maxWidth: 480, marginInline: 'auto' }}>
            El regalo perfecto para cualquier fan de LEGO. Sin fecha de vencimiento, se usan en cualquier compra de la tienda.
          </p>
        </div>

        {!sent ? (
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 24, padding: '40px',
          }}>
            {/* Amount selector */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>
              Elige el monto
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => { setSelected(a); setCustom('') }}
                  style={{
                    padding: '16px', borderRadius: 12,
                    fontSize: 18, fontWeight: 700,
                    background: selected === a && !custom ? 'var(--accent)' : 'var(--cream)',
                    color: selected === a && !custom ? '#fff' : 'var(--ink)',
                    border: `1px solid ${selected === a && !custom ? 'var(--accent)' : 'var(--line)'}`,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  ${a.toLocaleString('es-MX')}
                  <span style={{ fontSize: 11, fontWeight: 400, display: 'block', opacity: 0.7 }}>MXN</span>
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
                O escribe un monto personalizado (mínimo $100 MXN)
              </label>
              <input
                type="number"
                min={100}
                placeholder="Ej. 750"
                value={custom}
                onChange={e => { setCustom(e.target.value); setSelected(0) }}
                className="input"
                style={{ maxWidth: 200 }}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '0 0 28px' }} />

            {/* Recipient info */}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>
              Información del destinatario
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Nombre
                </label>
                <input type="text" placeholder="¿Para quién es?" className="input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email del destinatario
                </label>
                <input type="email" placeholder="su@email.com" className="input" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mensaje personal (opcional)
              </label>
              <textarea
                placeholder="Escribe un mensaje para acompañar la gift card…"
                rows={3}
                className="input"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Total a pagar</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>
                  ${finalAmount >= 100 ? finalAmount.toLocaleString('es-MX') : '—'}
                  <small style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 4 }}>MXN</small>
                </div>
              </div>
              <button
                onClick={handleBuy}
                className="btn btn-primary"
                disabled={finalAmount < 100}
                style={{ padding: '12px 32px', fontSize: 15, opacity: finalAmount < 100 ? 0.5 : 1 }}
              >
                Comprar gift card →
              </button>
            </div>
          </div>
        ) : (
          /* Success state */
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--success-border)',
            borderRadius: 24, padding: '56px 40px',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--success-bg)', border: '1px solid var(--success-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: 'var(--success)',
            }}>
              <Icon name="check" size={24} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
              ¡Gift card enviada!
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 28px', lineHeight: 1.6 }}>
              En unos minutos llegará al correo del destinatario con las instrucciones para canjearla.
            </p>
            <button onClick={() => setSent(false)} className="btn btn-secondary" style={{ marginRight: 12 }}>
              Comprar otra
            </button>
            <a href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              Seguir comprando
            </a>
          </div>
        )}

        {/* Info strips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 32 }}>
          {[
            { icon: 'clock',    title: 'Sin vencimiento',     desc: 'La gift card no expira. Se usa cuando el destinatario quiera.' },
            { icon: 'shield',   title: 'Seguro y al instante', desc: 'Se entrega por email inmediatamente después de confirmar el pago.' },
            { icon: 'sparkle',  title: 'Para toda la tienda',  desc: 'Aplica en minifiguras, sets, promos y pedidos personalizados.' },
          ].map(b => (
            <div key={b.title} style={{
              padding: '20px 24px', borderRadius: 14,
              background: 'var(--paper)', border: '1px solid var(--line)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
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
