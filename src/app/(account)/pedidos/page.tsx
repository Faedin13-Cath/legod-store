import Link from 'next/link'
import Icon from '@/components/ui/Icon'

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pagado:    { bg: '#EAE5F4', color: '#5526AD', border: '#D3C8EC', label: 'Pagado' },
  apartado:  { bg: '#FFF6DD', color: '#7A5A0A', border: '#F0DA8B', label: 'Apartado' },
  enviado:   { bg: '#DFF5E8', color: '#16623B', border: '#B6E2C7', label: 'Enviado' },
  entregado: { bg: '#F0F0F4', color: '#4F5180', border: '#D0D0E0', label: 'Entregado' },
}

export default function PedidosPage() {
  const orders: never[] = []

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 24px' }}>Mis pedidos</h1>

      {orders.length === 0 ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '56px', textAlign: 'center',
        }}>
          <Icon name="package" size={32} />
          <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>Aún no tienes pedidos.</p>
          <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 16 }}>
            Ver tienda
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => {
            const st = STATUS_STYLE[order.status]
            const prods = order.productIds
              .map(id => products.find(p => p.id === id))
              .filter(Boolean)

            return (
              <div key={order.id} style={{
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '20px 24px',
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{order.id}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px',
                      borderRadius: 999, background: st.bg,
                      color: st.color, border: `1px solid ${st.border}`,
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{order.date}</div>
                </div>

                {/* Products */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {prods.map(p => p && (
                    <div key={p.id} title={p.name} style={{
                      width: 48, height: 48, borderRadius: 8,
                      background: p.fig ? `linear-gradient(135deg, ${p.fig.c1} 0%, ${p.fig.c2} 100%)` : 'var(--cream-2)',
                      border: '1px solid var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                    {prods.length} {prods.length === 1 ? 'artículo' : 'artículos'} ·{' '}
                    <strong style={{ color: 'var(--ink)' }}>${order.total.toLocaleString('es-MX')} MXN</strong>
                  </div>
                  {order.tracking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                      <Icon name="truck" size={13} />
                      <span style={{ fontFamily: 'monospace' }}>{order.tracking}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
