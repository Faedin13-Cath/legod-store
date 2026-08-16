'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

const TIERS = [
  {
    id:        'padawan',
    label:     'Padawan',
    emoji:     '⭐',
    min:       0,
    max:       2499,
    color:     '#A0896C',
    bg:        '#A0896C14',
    earnLabel: '1 pto × cada $2 MXN',
    benefits:  ['1 punto por cada $2 MXN', 'Acceso a preventas', 'Historial de compras'],
  },
  {
    id:        'jedi',
    label:     'Caballero Jedi',
    emoji:     '💙',
    min:       2500,
    max:       9999,
    color:     '#3B82F6',
    bg:        '#3B82F614',
    earnLabel: '1 pto × cada $1.50 MXN',
    benefits:  ['1 punto por cada $1.50 MXN', 'Acceso prioritario a drops', 'Todo lo de Padawan'],
  },
  {
    id:        'maestro',
    label:     'Maestro Jedi',
    emoji:     '🔮',
    min:       10000,
    max:       Infinity,
    color:     '#7C3AED',
    bg:        '#7C3AED14',
    earnLabel: '1 pto × cada $1 MXN',
    benefits:  ['1 punto por cada $1 MXN', 'Preventa exclusiva', 'Todo lo de Caballero Jedi'],
  },
]

const REWARDS = [
  { pts: 500,  saldo: 50,  label: '$50 MXN en saldo',                    sublabel: 'Se acredita a tu cartera al instante' },
  { pts: 1500, saldo: 150, label: '$150 MXN en saldo',                   sublabel: 'Se acredita a tu cartera al instante' },
  { pts: 4000, saldo: 400, label: '$400 MXN en saldo',                   sublabel: 'Se acredita a tu cartera al instante' },
  { pts: 8000, saldo: 800, label: '$800 MXN en saldo + figura sorpresa', sublabel: 'Acredito a cartera + enviamos una figura de regalo' },
]

const TYPE_LABEL: Record<string, { label: string; color: string; sign: string }> = {
  purchase: { label: 'Compra',            color: 'var(--success)', sign: '+' },
  welcome:  { label: 'Bienvenida',        color: 'var(--accent)',  sign: '+' },
  referral: { label: 'Referido',          color: 'var(--accent)',  sign: '+' },
  sell:     { label: 'Colección vendida', color: 'var(--accent)',  sign: '+' },
  bonus:    { label: 'Bonus',             color: 'var(--accent)',  sign: '+' },
  redeem:   { label: 'Canje',             color: 'var(--danger)',  sign: '−' },
}

type HistoryItem = { id: string; points: number; type: string; description: string; created_at: string }

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
  const [pts, setPts] = useState(profile?.points_total ?? 0)

  const tier                              = getTier(pts)
  const { pct, remaining, next: nextTier } = getProgress(pts)

  const [history,    setHistory]    = useState<HistoryItem[]>([])
  const [loadHist,   setLoadHist]   = useState(true)
  const [redeeming,  setRedeeming]  = useState<number | null>(null)
  const [redeemDone, setRedeemDone] = useState<{ pts: number; saldo: number } | null>(null)
  const [redeemErr,  setRedeemErr]  = useState<string | null>(null)

  useEffect(() => {
    if (profile?.points_total !== undefined) setPts(profile.points_total)
  }, [profile?.points_total])

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

  async function redeemReward(r: typeof REWARDS[0]) {
    setRedeeming(r.pts)
    setRedeemErr(null)
    try {
      const res  = await fetch('/api/loyalty/redeem', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pts: r.pts, saldo: r.saldo, label: r.label }),
      })
      const data = await res.json()
      if (!res.ok) { setRedeemErr(data.error ?? 'Error al canjear'); return }
      setRedeemDone({ pts: r.pts, saldo: r.saldo })
      setPts(data.newPoints)
      // Refresh history
      if (user) {
        const supabase = createClient()
        supabase
          .from('points_history')
          .select('id, points, type, description, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data: h }) => { if (h) setHistory(h) })
      }
    } finally {
      setRedeeming(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Programa de lealtad</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          Acumula puntos en cada compra y canjéalos por saldo en tu cartera.
        </p>
      </div>

      {/* Points hero */}
      <div style={{
        background: `linear-gradient(135deg, ${tier.bg} 0%, var(--paper) 100%)`,
        border: `1.5px solid ${tier.color}55`,
        borderRadius: 20, padding: '28px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: tier.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: `0 4px 16px ${tier.color}44`,
            }}>
              {tier.emoji}
            </div>
            <div style={{
              padding: '4px 14px', borderRadius: 999,
              background: tier.color, color: '#fff',
              fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'center',
            }}>
              {tier.label}
            </div>
          </div>
        </div>

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
                borderRadius: 14, padding: '14px',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, flexShrink: 0,
                  }}>
                    {t.emoji}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? t.color : 'var(--ink)', lineHeight: 1.2 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 1 }}>
                      {t.max === Infinity ? `${t.min.toLocaleString('es-MX')}+ pts` : `${t.min.toLocaleString('es-MX')}–${t.max.toLocaleString('es-MX')} pts`}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: t.color,
                  padding: '4px 8px', borderRadius: 6,
                  background: `${t.color}18`, marginBottom: 10,
                }}>
                  {t.earnLabel}
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {t.benefits.map(b => (
                    <li key={b} style={{ fontSize: 11, color: active ? 'var(--ink-2)' : 'var(--ink-3)', display: 'flex', gap: 5, alignItems: 'flex-start' }}>
                      <span style={{ color: t.color, flexShrink: 0, marginTop: 1 }}><Icon name="check" size={10} /></span>
                      {b}
                    </li>
                  ))}
                </ul>
                {active && (
                  <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: t.color }}>← Tu nivel actual</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Rewards */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
          Canjear puntos
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ink-4)', margin: '0 0 12px' }}>
          El saldo se acredita a tu cartera al instante y lo puedes usar en tu próxima compra.
        </p>

        {redeemDone && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 12, marginBottom: 12,
            background: '#F0FBF4', border: '1px solid #86EFAC',
          }}>
            <span style={{ fontSize: 22 }}>🎉</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>¡Canje exitoso!</div>
              <div style={{ fontSize: 12, color: '#15803D', marginTop: 1 }}>
                Se acreditaron ${redeemDone.saldo.toLocaleString('es-MX')} MXN a tu saldo.{' '}
                <Link href="/saldo" style={{ color: '#15803D', fontWeight: 700 }}>Ver saldo →</Link>
              </div>
            </div>
            <button onClick={() => setRedeemDone(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803D', fontSize: 16, padding: 4 }}>×</button>
          </div>
        )}

        {redeemErr && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #F2BFBF', color: '#A23030', fontSize: 13, marginBottom: 12 }}>
            {redeemErr}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REWARDS.map(r => {
            const canRedeem = pts >= r.pts
            const pctFill   = Math.min(100, Math.round((pts / r.pts) * 100))
            const isLoading = redeeming === r.pts
            return (
              <div key={r.pts} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', borderRadius: 12,
                background: canRedeem ? '#F0FBF4' : 'var(--paper)',
                border: `1px solid ${canRedeem ? '#86EFAC' : 'var(--line)'}`,
                transition: 'all .15s',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: canRedeem ? '#22C55E' : 'var(--cream)',
                  border: `2px solid ${canRedeem ? '#22C55E' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {canRedeem ? '🎁' : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: canRedeem ? 0 : 6 }}>
                    {r.sublabel} · {r.pts.toLocaleString('es-MX')} pts
                  </div>
                  {!canRedeem && (
                    <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', maxWidth: 200 }}>
                      <div style={{ width: `${pctFill}%`, height: '100%', background: tier.color, borderRadius: 99 }} />
                    </div>
                  )}
                </div>
                <button
                  disabled={!canRedeem || redeeming !== null}
                  onClick={() => canRedeem && !redeeming && redeemReward(r)}
                  className={`btn btn-sm ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ opacity: canRedeem ? 1 : 0.45, whiteSpace: 'nowrap', flexShrink: 0, minWidth: 110 }}
                >
                  {isLoading
                    ? 'Canjeando…'
                    : canRedeem
                      ? 'Canjear →'
                      : `Faltan ${(r.pts - pts).toLocaleString('es-MX')} pts`}
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
            { emoji: '🛍️', label: 'Comprar en tienda',     sub: 'Según tu nivel: $1–$2 MXN = 1 pto' },
            { emoji: '🤝', label: 'Vender tu colección',   sub: '+200 puntos bonus' },
            { emoji: '👋', label: 'Primera compra',        sub: '+100 puntos de bienvenida' },
            { emoji: '👥', label: 'Referir a un amigo',    sub: '+150 puntos cuando compre' },
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
