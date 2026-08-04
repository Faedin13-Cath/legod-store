'use client'

import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { sampleUser, products } from '@/lib/data'

function formatDue(ms: number) {
  const diff = ms - Date.now()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hrs  = Math.floor(diff / (1000 * 60 * 60))
  if (days > 0) return `${days}d restantes`
  if (hrs > 0)  return `${hrs}h restantes`
  return 'Vence hoy'
}

export default function ApartadosPage() {
  const { apartados } = sampleUser

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Apartados</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Pagaste el 30% de anticipo. Tienes 7 días para liquidar el saldo restante o el anticipo no es reembolsable.
      </p>

      {apartados.length === 0 ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '56px', textAlign: 'center',
        }}>
          <Icon name="clock" size={32} />
          <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>No tienes apartados activos.</p>
          <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 16 }}>
            Ver tienda
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {apartados.map(ap => {
            const product = products.find(p => p.id === ap.productId)
            if (!product) return null

            const pct   = Math.round((ap.paid / ap.total) * 100)
            const left  = ap.total - ap.paid
            const due   = formatDue(ap.dueAt)
            const urgent = ap.dueAt - Date.now() < 2 * 24 * 60 * 60 * 1000

            return (
              <div key={ap.productId} style={{
                background: 'var(--paper)',
                border: `1px solid ${urgent ? '#F2BFBF' : 'var(--line)'}`,
                borderRadius: 16, padding: '20px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  {/* Color swatch */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 10, flexShrink: 0,
                    background: product.fig ? `linear-gradient(135deg, ${product.fig.c1} 0%, ${product.fig.c2} 100%)` : 'var(--cream-2)',
                    border: '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {product.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{product.name}</div>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 10px',
                        borderRadius: 999,
                        background: urgent ? '#FCE3E3' : 'var(--warning-bg)',
                        color: urgent ? '#A23030' : 'var(--warning)',
                        border: `1px solid ${urgent ? '#F2BFBF' : '#F0DA8B'}`,
                      }}>
                        {due}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>{product.tag}</div>

                    {/* Progress bar */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 5 }}>
                        <span>Pagado: ${ap.paid.toLocaleString('es-MX')} MXN</span>
                        <span>Saldo: ${left.toLocaleString('es-MX')} MXN</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
                        {pct}% cubierto · Total: ${ap.total.toLocaleString('es-MX')} MXN
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="btn btn-primary btn-sm">
                        Liquidar ${left.toLocaleString('es-MX')} MXN
                      </button>
                      <Link href={`/tienda/${product.id}`} className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                        Ver producto
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{
        marginTop: 20, padding: '14px 18px',
        background: 'var(--cream-2)', border: '1px solid var(--line)',
        borderRadius: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
      }}>
        <strong>¿Cómo funciona el apartado?</strong><br/>
        Reservas con 30% de anticipo. Tienes 7 días para liquidar el saldo restante. Si no liquidas a tiempo, el anticipo no es reembolsable y el producto vuelve a stock. Escríbenos si necesitas una extensión.
      </div>
    </div>
  )
}
