'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

type SellRequest = {
  id: string; created_at: string; name: string; phone: string
  description: string; payment: string | null; photos: string[]; status: string
}

type ContactMessage = {
  id: string; created_at: string; name: string; email: string
  subject: string | null; message: string; status: string
}

type OrderRow = {
  id: string; shopify_order_id: string; order_number: string
  total_price: number; financial_status: string; fulfillment_status: string
  tracking_number: string | null; carrier: string | null
  line_items: { title: string; quantity: number }[]
  created_at: string
  customer: { name: string; handle: string | null; email: string | null } | null
}

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const isOwner = !!profile?.is_admin

  const [sells, setSells] = useState<SellRequest[]>([])
  const [loadingSells, setLoadingSells] = useState(true)

  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)

  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (!isOwner) return
    fetch('/api/admin/sell-requests')
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => { setSells(d.requests ?? []); setLoadingSells(false) })
      .catch(() => setLoadingSells(false))

    fetch('/api/admin/contact-messages')
      .then(r => r.ok ? r.json() : { messages: [] })
      .then(d => { setMessages(d.messages ?? []); setLoadingMessages(false) })
      .catch(() => setLoadingMessages(false))

    fetch('/api/admin/orders')
      .then(r => r.ok ? r.json() : { orders: [] })
      .then(d => { setOrders(d.orders ?? []); setLoadingOrders(false) })
      .catch(() => setLoadingOrders(false))
  }, [isOwner])

  if (loading) {
    return <div style={{ color: 'var(--ink-3)', fontSize: 15, padding: '40px 0' }}>Cargando…</div>
  }

  if (!isOwner) {
    return (
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
        <Icon name="lock" size={28} />
        <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>Esta sección es solo para el administrador.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Administración</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          Herramientas de la tienda. Solo tú ves esta sección.
        </p>
      </div>

      {/* Envíos — carga masiva de paqueterías */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="truck" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Envíos — Estafeta</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
          Descarga las direcciones de <strong>todos los clientes</strong> en el formato de carga masiva
          (Multiguía) de Estafeta. Súbelo directo en el portal de Estafeta para generar las guías.
          Solo incluye pedidos que eligieron Estafeta.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/api/admin/estafeta?scope=pending" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            <Icon name="truck" size={14} /> Pendientes por enviar
          </a>
          <a href="/api/admin/estafeta?scope=all" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            Descargar todos
          </a>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-4)', margin: '12px 0 0', lineHeight: 1.5 }}>
          El peso (1 kg) y dimensiones (20×15×25 cm) van con valores por defecto — ajústalos en el CSV
          si alguna figura es más grande.
        </p>
      </div>

      {/* Pedidos recientes */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="cart" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Pedidos recientes</h2>
        </div>

        {loadingOrders ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Cargando…</p>
        ) : orders.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Aún no hay pedidos registrados.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0 10px 8px 0', fontWeight: 600 }}>Pedido</th>
                  <th style={{ padding: '0 10px 8px', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '0 10px 8px', fontWeight: 600 }}>Artículos</th>
                  <th style={{ padding: '0 10px 8px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '0 10px 8px', fontWeight: 600 }}>Envío</th>
                  <th style={{ padding: '0 0 8px', fontWeight: 600 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const date = new Date(o.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  const itemsLabel = (o.line_items ?? []).map(li => `${li.title}${li.quantity > 1 ? ` ×${li.quantity}` : ''}`).join(', ')
                  const fulfilled = o.fulfillment_status === 'fulfilled'
                  return (
                    <tr key={o.id} style={{ borderTop: '1px solid var(--line)' }}>
                      <td style={{ padding: '10px 10px 10px 0', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>#{o.order_number}</td>
                      <td style={{ padding: '10px', color: 'var(--ink-2)' }}>
                        {o.customer ? (o.customer.handle ? `@${o.customer.handle}` : o.customer.name) : '—'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--ink-2)', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={itemsLabel}>
                        {itemsLabel || '—'}
                      </td>
                      <td style={{ padding: '10px', color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        ${Number(o.total_price).toLocaleString('es-MX')}
                      </td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                          background: fulfilled ? '#DFF5E8' : 'var(--cream)',
                          color: fulfilled ? '#16623B' : 'var(--ink-3)',
                          border: `1px solid ${fulfilled ? '#B6E2C7' : 'var(--line)'}`,
                        }}>
                          {fulfilled ? 'Enviado' : 'Pendiente'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 0', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{date}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Solicitudes de venta (Véndenos) */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="package" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Solicitudes de venta
            {sells.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>
                {sells.length}
              </span>
            )}
          </h2>
        </div>

        {loadingSells ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Cargando…</p>
        ) : sells.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Aún no hay solicitudes de clientes que quieran venderte piezas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sells.map(s => {
              const date = new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              const wa   = s.phone.replace(/\D/g, '')
              return (
                <div key={s.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', background: 'var(--cream)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.phone} · {date} · pago: {s.payment || '—'}</div>
                    </div>
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                      <Icon name="whatsapp" size={14} /> Responder
                    </a>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{s.description}</p>
                  {s.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {s.photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Foto ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Mensajes de contacto */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="chat" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Mensajes de contacto
            {messages.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>
                {messages.length}
              </span>
            )}
          </h2>
        </div>

        {loadingMessages ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Cargando…</p>
        ) : messages.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Aún no hay mensajes desde el formulario de contacto.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map(m => {
              const date = new Date(m.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              return (
                <div key={m.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', background: 'var(--cream)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.email} · {date}{m.subject ? ` · ${m.subject}` : ''}</div>
                    </div>
                    <a href={`mailto:${m.email}`} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                      <Icon name="chat" size={14} /> Responder
                    </a>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{m.message}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
