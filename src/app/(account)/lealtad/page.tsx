'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

const WHATSAPP = '5215512345678'

const TIERS = [
  {
    id: 'bronce',
    label: 'Bronce',
    min: 0,
    max: 999,
    color: '#CD7F32',
    bg: '#CD7F3218',
    benefits: ['1 punto por cada $1 MXN', 'Acceso a preventas', 'Historial de compras'],
  },
  {
    id: 'plata',
    label: 'Plata',
    min: 1000,
    max: 4999,
    color: '#8B9AAD',
    bg: '#8B9AAD18',
    benefits: ['+5% de descuento en todas las compras', 'Acceso prioritario a drops', 'Todo lo de Bronce'],
  },
  {
    id: 'oro',
    label: 'Oro',
    min: 5000,
    max: Infinity,
    color: '#E2A91A',
    bg: '#E2A91A18',
    benefits: ['+10% de descuento en todas las compras', 'Envío gratis siempre', 'Preventa exclusiva Oro', 'Todo lo de Plata'],
  },
]

const REWARDS = [
  { pts: 500,  label: '$25 MXN en crédito',  sublabel: 'Aplicable a cualquier compra' },
  { pts: 1000, label: '$50 MXN en crédito',  sublabel: 'Aplicable a cualquier compra' },
  { pts: 2500, label: '$125 MXN + envío gratis', sublabel: 'Válido para un pedido' },
  { pts: 5000, label: '$250 MXN + figura sorpresa', sublabel: 'Enviamos una figura extra de regalo' },
]

const TYPE_LABEL: Record<string, { label: string; color: string; sign: string }> = {
  purchase: { label: 'Compra',         color: 'var(--success)',  sign: '+' },
  welcome:  { label: 'Bienvenida',     color: 'var(--accent)',   sign: '+' },
  referral: { label: 'Referido',       color: 'var(--accent)',   sign: '+' },
  sell:     { label: 'Colección vendida', color: 'var(--accent)', sign: '+' },
  bonus:    { label: 'Bonus',          color: 'var(--accent)',   sign: '+' },
  redeem:   { label: 'Canje',          color: 'var(--danger)',   sign: '−' },
}

type HistoryItem = {
  id: string
  points: number
  type: string
  description: string
  created_at: string
}

function getTier(pts: number) {
  return TIERS.findLast(t => pts >= t.min) ?? TIERS[0]
}

function getProgress(pts: number) {
  const tier = getTier(pts)
  const next = TIERS.find(t => t.min > pts)
  if (!next) return { pct: 100, remaining: 0, next: null }
  const range = next.min - tier.min
  const done  = pts - tier.min
  return { pct: Math.round((done / range) * 100), remaining: next.min - pts, next }
}

export default function LealtadPage() {
  const { profile, user } = useAuth()
  const pts = profile?.points_total ?? 0

  const tier               = getTier(pts)
  const { pct, remaining, next: nextTier } = getProgress(pts)

  const [history,  setHistory]  = useState<HistoryItem[]>([])
  const [loadHist, setLoadHist] = useState(true)

  useEffect(() => {
    if (!user) { setLoadHist(false); return }
    const supabase = createClient()
    supabase
      .from('points_history')
      .select('id, points, type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { setHistory(data ?? []); setLoadHist(false) })
  }, [user])

  function redeemWhatsApp(r: typeof REWARDS[0]) {
    const msg = `Hola, soy ${profile?.name ?? ''} y quiero canjear ${r.pts} puntos por: ${r.label} 🎁\n\nMi correo registrado: ${profile?.email ?? user?.email ?? ''}`
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Programa de lealtad</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>$1 MXN en compras = 1 punto · Acumula y canjea</p>
      </div>

      {/* Points hero */}
      <div style={{
        background: `linear-gradient(135deg, ${tier.bg} 0%, var(--paper) 100%)`,
        border: `1.5px solid ${tier.color}55`,
        borderRadius: 20, padding: '28px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative ring */}
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: tier.color, opacity: 0.06,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              Tus puntos
            </div>
            <div style={{ fontSize: 56, fontWeight: 800, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {pts.toLocaleString('es-MX')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>puntos acumulados</div>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: tier.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: `0 4px 16px ${tier.color}44`,
            }}>
              {tier.id === 'bronce' ? '🥉' : tier.id === 'plata' ? '🥈' : '🥇'}
            </div>
            <div style={{
              padding: '4px 14px', borderRadius: 999,
              background: tier.color, color: '#fff',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              {tier.label}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>
              <span>Progreso hacia <strong style={{ color: nextTier.color }}>{nextTier.label}</strong></span>
              <span style={{ fontWeight: 600 }}>{remaining.toLocaleString('es-MX')} pts para subir</span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                borderRadius: 99, transition: 'width .5s ease',
              }} />
            </div>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 10,
            background: `${tier.color}22`, border: `1px solid ${tier.color}55`,
          }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>¡Nivel máximo alcanzado!</span>
          </div>
        )}
      </div>

      {/* Tiers */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
          Niveles
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {TIERS.map(t => {
            const active = t.id === tier.id
            return (
              <div key={t.id} style={{
                background: active ? t.bg : 'var(--paper)',
                border: `${active ? 2 : 1}px solid ${active ? t.color : 'var(--line)'}`,
                borderRadius: 14, padding: '16px',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {t.id === 'bronce' ? '🥉' : t.id === 'plata' ? '🥈' : '🥇'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: active ? t.color : 'var(--ink)' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      {t.max === Infinity ? `${t.min.toLocaleString('es-MX')}+ pts` : `${t.min.toLocaleString('es-MX')} – ${t.max.toLocaleString('es-MX')} pts`}
                    </div>
                  </div>
                  {active && (
                    <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: t.color, whiteSpace: 'nowrap' }}>
                      ← Tú aquí
                    </div>
                  )}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {t.benefits.map(b => (
                    <li key={b} style={{ fontSize: 12, color: active ? 'var(--ink-2)' : 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: t.color, flexShrink: 0, marginTop: 1 }}><Icon name="check" size={11} /></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rewards */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
          Canjear puntos
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REWARDS.map(r => {
            const canRedeem = pts >= r.pts
            const pctFill   = Math.min(100, Math.round((pts / r.pts) * 100))
            return (
              <div key={r.pts} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12,
                background: canRedeem ? 'var(--success-bg)' : 'var(--paper)',
                border: `1px solid ${canRedeem ? 'var(--success-border)' : 'var(--line)'}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: canRedeem ? 'var(--success)' : 'var(--cream)',
                  border: `2px solid ${canRedeem ? 'var(--success)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {canRedeem ? '🎁' : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: canRedeem ? 0 : 6 }}>{r.sublabel} · {r.pts.toLocaleString('es-MX')} pts</div>
                  {!canRedeem && (
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', maxWidth: 200 }}>
                      <div style={{ width: `${pctFill}%`, height: '100%', background: tier.color, borderRadius: 99 }} />
                    </div>
                  )}
                </div>
                <button
                  disabled={!canRedeem}
                  onClick={() => canRedeem && redeemWhatsApp(r)}
                  className={`btn btn-sm ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ opacity: canRedeem ? 1 : 0.5, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  {canRedeem ? 'Canjear →' : `Faltan ${(r.pts - pts).toLocaleString('es-MX')} pts`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* How to earn */}
      <div style={{
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 14, padding: '18px 20px',
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px' }}>
          Cómo ganar puntos
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { emoji: '🛍️', label: 'Comprar en tienda',          sub: '$1 MXN = 1 punto' },
            { emoji: '🤝', label: 'Vendernos tu colección',     sub: '+200 puntos bonus' },
            { emoji: '👋', label: 'Primera compra',             sub: '+100 puntos de bienvenida' },
            { emoji: '👥', label: 'Referir a un amigo',         sub: '+150 puntos cuando compre' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'var(--cream)', fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.emoji}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points history */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
          Historial de puntos
        </h2>
        {loadHist ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Cargando…</div>
        ) : history.length === 0 ? (
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 4 }}>Sin movimientos todavía</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Tus puntos aparecerán aquí después de tu primera compra.</div>
          </div>
        ) : (
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {history.map((h, i) => {
              const meta = TYPE_LABEL[h.type] ?? { label: h.type, color: 'var(--ink-2)', sign: '+' }
              const date = new Date(h.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
              return (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--line-soft)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: `${meta.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 16 }}>
                      {h.type === 'purchase' ? '🛍️' : h.type === 'redeem' ? '🎁' : h.type === 'welcome' ? '👋' : h.type === 'referral' ? '👥' : '⭐'}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 1 }}>{h.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                      <span style={{
                        display: 'inline-block', padding: '1px 7px', borderRadius: 999,
                        background: `${meta.color}18`, color: meta.color,
                        fontWeight: 600, marginRight: 6,
                      }}>
                        {meta.label}
                      </span>
                      {date}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: meta.sign === '+' ? 'var(--success)' : 'var(--danger)',
                    whiteSpace: 'nowrap',
                  }}>
                    {meta.sign}{h.points.toLocaleString('es-MX')} pts
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
