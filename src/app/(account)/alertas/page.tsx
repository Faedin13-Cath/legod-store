'use client'

import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { sampleUser, products } from '@/lib/data'

const TYPE_ICON: Record<string, string> = {
  restock:   'bell',
  pricedrop: 'sale',
  wishlist:  'star',
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState(sampleUser.alerts)

  function markRead(idx: number) {
    setAlerts(prev => prev.map((a, i) => i === idx ? { ...a, read: true } : a))
  }

  function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const unread = alerts.filter(a => !a.read).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Alertas</h1>
          {unread > 0 && (
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 600,
              background: 'var(--accent)', color: '#fff',
              padding: '2px 10px', borderRadius: 999,
            }}>
              {unread} sin leer
            </span>
          )}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary btn-sm">
            Marcar todas como leídas
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '56px', textAlign: 'center',
        }}>
          <Icon name="bell" size={32} />
          <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>No tienes alertas aún. Te avisaremos cuando haya novedades en tu wishlist.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((alert, idx) => {
            const product = products.find(p => p.id === alert.productId)
            return (
              <div
                key={idx}
                style={{
                  background: alert.read ? 'var(--paper)' : 'var(--accent-soft)',
                  border: `1px solid ${alert.read ? 'var(--line)' : 'var(--accent)'}`,
                  borderRadius: 12, padding: '14px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  cursor: alert.read ? 'default' : 'pointer',
                }}
                onClick={() => !alert.read && markRead(idx)}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: alert.read ? 'var(--cream-2)' : 'var(--accent)',
                  color: alert.read ? 'var(--ink-3)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={TYPE_ICON[alert.type] ?? 'bell'} size={15} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: alert.read ? 400 : 600, color: 'var(--ink)', marginBottom: 2 }}>
                    {alert.message}
                  </div>
                  {product && (
                    <Link href={`/tienda/${product.id}`} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                      Ver {product.name} →
                    </Link>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{alert.at}</span>
                  {!alert.read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Setup section */}
      <div style={{
        marginTop: 28, background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 16, padding: '20px 24px',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
          Configurar alertas
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'restock',   label: 'Restock de wishlist',      desc: 'Cuando una figura de tu wishlist vuelva a stock' },
            { key: 'pricedrop', label: 'Bajada de precio',          desc: 'Cuando baje el precio de algo en tu wishlist' },
            { key: 'drop',      label: 'Nuevos ingresos',           desc: 'Cuando lleguen figuras de nuevas a la tienda' },
          ].map(opt => (
            <label key={opt.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              border: '1px solid var(--line)', cursor: 'pointer',
            }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Las notificaciones llegan por email. Para WhatsApp, configura tu número en{' '}
          <Link href="/perfil" style={{ color: 'var(--accent)' }}>Mi perfil</Link>.
        </div>
      </div>
    </div>
  )
}
