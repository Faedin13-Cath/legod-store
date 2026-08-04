import Icon from '@/components/ui/Icon'
import { sampleUser } from '@/lib/data'

const TIERS = [
  { id: 'bronce',   label: 'Bronce',    min: 0,    max: 500,  color: '#CD7F32', desc: '5% de puntos por compra' },
  { id: 'plata',    label: 'Plata',     min: 500,  max: 1500, color: '#A8A9AD', desc: '8% de puntos + envío preferente' },
  { id: 'oro',      label: 'Oro',       min: 1500, max: 4000, color: '#E2A91A', desc: '12% de puntos + preventa exclusiva' },
  { id: 'dragon',   label: 'Dragón',    min: 4000, max: Infinity, color: '#5526AD', desc: '15% + acceso a figuras únicas' },
]

const REWARDS = [
  { pts: 500,  label: '$50 MXN en crédito' },
  { pts: 1000, label: '$100 MXN en crédito' },
  { pts: 1500, label: '$160 MXN en crédito + envío gratis' },
  { pts: 2500, label: '$280 MXN + figura sorpresa' },
]

export default function LealtadPage() {
  const user    = sampleUser
  const pts     = user.pointsTotal
  const nextPts = user.pointsNextReward

  const currentTier = TIERS.find(t => pts >= t.min && pts < t.max) ?? TIERS[0]
  const nextTier    = TIERS.find(t => pts < t.min)
  const pct         = Math.min(100, Math.round((pts / nextPts) * 100))

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 24px' }}>Programa de lealtad</h1>

      {/* Points card */}
      <div style={{
        background: `linear-gradient(135deg, ${currentTier.color}22 0%, var(--accent-soft) 100%)`,
        border: `1px solid ${currentTier.color}55`,
        borderRadius: 20, padding: '28px 32px', marginBottom: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
              Tus puntos
            </div>
            <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--ink)', lineHeight: 1, marginBottom: 4 }}>
              {pts.toLocaleString('es-MX')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>puntos acumulados</div>
          </div>
          <div style={{
            padding: '8px 20px', borderRadius: 999,
            background: currentTier.color, color: '#fff',
            fontSize: 13, fontWeight: 700,
          }}>
            {currentTier.label}
          </div>
        </div>

        {nextTier && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 6 }}>
              <span>Progreso hacia {nextTier.label}</span>
              <span>{nextTier.min - pts} pts para subir</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: currentTier.color, borderRadius: 99,
                transition: 'width .4s',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Tiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {TIERS.map(tier => {
          const active = tier.id === currentTier.id
          return (
            <div key={tier.id} style={{
              background: active ? `${tier.color}18` : 'var(--paper)',
              border: `1px solid ${active ? tier.color : 'var(--line)'}`,
              borderRadius: 12, padding: '14px 16px',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: tier.color, marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{tier.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', margin: '4px 0 8px', lineHeight: 1.4 }}>
                {tier.min > 0 ? `${tier.min.toLocaleString('es-MX')}+ pts` : 'Desde 0'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>{tier.desc}</div>
              {active && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 600, color: tier.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="check" size={11} /> Nivel actual
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rewards */}
      <div style={{
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 16, padding: '20px 24px',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
          Recompensas disponibles
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {REWARDS.map(r => {
            const canRedeem = pts >= r.pts
            return (
              <div key={r.pts} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 10,
                background: canRedeem ? 'var(--success-bg)' : 'var(--cream)',
                border: `1px solid ${canRedeem ? 'var(--success-border)' : 'var(--line)'}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: canRedeem ? 'var(--success)' : 'var(--ink-4)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="sparkle" size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{r.pts.toLocaleString('es-MX')} puntos</div>
                </div>
                <button
                  disabled={!canRedeem}
                  className={`btn btn-sm ${canRedeem ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ opacity: canRedeem ? 1 : 0.5 }}
                >
                  {canRedeem ? 'Canjear' : `Faltan ${(r.pts - pts).toLocaleString('es-MX')}`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* How to earn */}
      <div style={{ marginTop: 16, padding: '16px 20px', background: 'var(--cream-2)', border: '1px solid var(--line)', borderRadius: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>¿Cómo ganar puntos?</div>
        <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.8 }}>
          <li>$1 MXN en compra = 1 punto</li>
          <li>Primera compra: +100 puntos bonus</li>
          <li>Compartir en Instagram: +50 puntos por post</li>
          <li>Vendernos tu colección: +200 puntos bonus</li>
          <li>Referidos: +150 puntos por cada amigo que compre</li>
        </ul>
      </div>
    </div>
  )
}
