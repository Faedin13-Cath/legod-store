'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

const OWNER_EMAIL = 'faedin@hotmail.com'

type LineItem = { title: string; quantity: number; price: string }
type Order = {
  id: string
  shopify_order_id: string
  order_number: string
  total_price: number
  financial_status: string
  fulfillment_status: string
  tracking_number: string | null
  carrier: string | null
  line_items: LineItem[]
  created_at: string
}

const CARRIER_URL: Record<string, string> = {
  'Estafeta': 'https://www.estafeta.com/herramientas/rastreo?wayBillType=1&waybill=',
  'FedEx':    'https://www.fedex.com/fedextrack/?trknbr=',
  'Correos':  'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Rastreo.aspx?num=',
}

const FULFIL: Record<string, { label: string; color: string; icon: string }> = {
  fulfilled:   { label: 'Enviado',    color: 'var(--success)', icon: 'truck' },
  unfulfilled: { label: 'Preparando', color: 'var(--gold)',    icon: 'clock' },
  partial:     { label: 'Parcial',    color: 'var(--gold)',    icon: 'clock' },
}

export default function PedidosPage() {
  const { user } = useAuth()
  const isOwner  = (user?.email ?? '').toLowerCase() === OWNER_EMAIL
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => { setOrders(d.orders ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ color: 'var(--ink-3)', fontSize: 15, padding: '40px 0' }}>Cargando pedidos…</div>
  )

  if (!orders.length) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '0 0 24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Mis pedidos</h1>
        {isOwner && (
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/api/admin/estafeta?scope=pending" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              <Icon name="truck" size={14} /> Envíos pendientes (Estafeta)
            </a>
            <a href="/api/admin/estafeta?scope=all" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              Todos
            </a>
          </div>
        )}
      </div>
      <div style={{
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 16, padding: 56, textAlign: 'center',
      }}>
        <Icon name="package" size={32} />
        <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>Aún no tienes pedidos.</p>
        <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 16, display: 'inline-block' }}>
          Ver tienda
        </Link>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '0 0 24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Mis pedidos</h1>
        {isOwner && (
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/api/admin/estafeta?scope=pending" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              <Icon name="truck" size={14} /> Envíos pendientes (Estafeta)
            </a>
            <a href="/api/admin/estafeta?scope=all" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              Todos
            </a>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {orders.map(o => {
          const ful      = FULFIL[o.fulfillment_status] ?? FULFIL.unfulfilled
          const date     = new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
          const total    = Number(o.total_price).toLocaleString('es-MX', { minimumFractionDigits: 0 })
          const trackUrl = o.carrier && o.tracking_number ? (CARRIER_URL[o.carrier] ?? '') + o.tracking_number : null
          const isRock   = !o.tracking_number && o.fulfillment_status === 'unfulfilled'

          return (
            <div key={o.id} style={{
              background: 'var(--paper)', border: '1px solid var(--line)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                    Pedido #{o.order_number}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                    background: `${ful.color}18`, color: ful.color,
                  }}>
                    <Icon name={ful.icon as never} size={12} />
                    {ful.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
                    ${total} MXN
                  </span>
                </div>
              </div>

              {/* Products */}
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--line)' }}>
                {(o.line_items as LineItem[]).map((li, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: 'var(--ink-2)', padding: '3px 0',
                  }}>
                    <span><span style={{ color: 'var(--ink-3)', marginRight: 6 }}>×{li.quantity}</span>{li.title}</span>
                    <span style={{ color: 'var(--ink-3)' }}>${parseFloat(li.price).toLocaleString('es-MX')} MXN</span>
                  </div>
                ))}
              </div>

              {/* Tracking / delivery */}
              <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="truck" size={14} color="var(--ink-3)" />
                {trackUrl ? (
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                    {o.carrier} ·{' '}
                    <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                      {o.tracking_number}
                    </a>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 6 }}>→ rastrear</span>
                  </span>
                ) : isRock ? (
                  <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Entrega en Rock Show — te avisamos por WhatsApp</span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Preparando tu pedido, número de rastreo pronto</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
