'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

type Prefs = { restock: boolean; pricedrop: boolean; drop: boolean; whatsapp: string }

const DEFAULT: Prefs = { restock: true, pricedrop: false, drop: true, whatsapp: '' }

const OPTS = [
  { key: 'restock'  , label: 'Restock de wishlist', desc: 'Cuando una figura de tu wishlist vuelva a stock' },
  { key: 'pricedrop', label: 'Bajada de precio',     desc: 'Cuando baje el precio de algo en tu wishlist'   },
  { key: 'drop'     , label: 'Nuevos ingresos',      desc: 'Cuando lleguen figuras nuevas a la tienda'      },
] as const

export default function AlertasPage() {
  const { user } = useAuth()
  const [prefs,   setPrefs]   = useState<Prefs>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch('/api/alerts/prefs')
      .then(r => r.json())
      .then(d => {
        setPrefs({ restock: d.restock, pricedrop: d.pricedrop, drop: d.drop, whatsapp: d.whatsapp ?? '' })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  async function save(next: Prefs) {
    setPrefs(next)
    setSaving(true)
    try {
      await fetch('/api/alerts/prefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      setToast('Preferencias guardadas ✓')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  function toggle(key: keyof Prefs) {
    if (key === 'whatsapp') return
    save({ ...prefs, [key]: !prefs[key] })
  }

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <p style={{ color: 'var(--ink-3)', marginBottom: 16 }}>Inicia sesión para gestionar tus alertas.</p>
      <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Iniciar sesión</Link>
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Alertas</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px' }}>
        Te avisamos por email cuando haya novedades en tu wishlist.
      </p>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
          Cargando preferencias…
        </div>
      ) : (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 24px' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
            Configurar alertas
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {OPTS.map(opt => (
              <label key={opt.key} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${prefs[opt.key] ? 'var(--accent)' : 'var(--line)'}`,
                background: prefs[opt.key] ? 'var(--accent-soft)' : 'transparent',
                transition: 'all .15s',
              }}>
                <input
                  type="checkbox"
                  checked={prefs[opt.key]}
                  onChange={() => toggle(opt.key)}
                  disabled={saving}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* WhatsApp number */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
              WhatsApp (opcional)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="tel"
                placeholder="52 55 1234 5678"
                value={prefs.whatsapp}
                onChange={e => setPrefs(p => ({ ...p, whatsapp: e.target.value }))}
                onBlur={() => save(prefs)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--line)', background: 'var(--cream)',
                  color: 'var(--ink)', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
              Con tu número, Jango te puede escribir directo por WhatsApp.
            </div>
          </div>

          {toast && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 10,
              background: 'var(--accent-soft)', border: '1px solid var(--accent)',
              color: 'var(--accent)', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name="check" size={15} /> {toast}
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Las notificaciones llegan por email a <strong>{user.email}</strong>.
          </div>
        </div>
      )}

      {/* Info empty state */}
      <div style={{
        marginTop: 20, padding: '14px 18px',
        background: 'var(--cream)', border: '1px solid var(--line)',
        borderRadius: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
      }}>
        <strong>¿Cómo funcionan las alertas?</strong><br />
        Cuando Jango marque una figura como <em>restock</em> o agregue nuevas figuras, recibirás un email automático.
        Si guardas tu WhatsApp, Jango puede mandarte un mensaje directo desde su teléfono con un solo clic.
      </div>
    </div>
  )
}
