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

type Cliente = { name: string; handle: string | null; email: string | null; whatsapp: string | null }

type Casillero = {
  userId: string; customer: Cliente | null
  pedidos: { id: string; order_number: string; line_items: { title: string; quantity: number }[]; created_at: string }[]
  piezas: number; diasMasViejo: number
}

type Envio = {
  id: string; carrier: string; cost: number; status: string
  tracking_number: string | null; created_at: string
  shipping: { name?: string; phone?: string; street?: string; numExt?: string; colonia?: string; city?: string; state?: string; zip?: string } | null
  customer: Cliente | null
  contenido: { title: string; quantity: number }[]
}

type PreventaFigura = {
  handle: string; name: string; photo: string | null; stock: number
  arrivedAt: string | null
  unidades: number; pendiente: number; clientes: number
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

  const [mailStatus, setMailStatus] = useState('')
  const [mailBusy, setMailBusy] = useState(false)

  async function enviarPreviews() {
    setMailBusy(true); setMailStatus('')
    try {
      const res = await fetch('/api/admin/email-preview', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setMailStatus(d.error ?? 'No se pudieron enviar.'); return }
      const fall = (d.fallidos ?? []) as { plantilla: string; error: string }[]
      setMailStatus(
        `Enviados a ${d.to}: ${(d.enviados ?? []).join(', ')}`
        + (fall.length ? ` · Fallaron: ${fall.map(f => `${f.plantilla} (${f.error})`).join('; ')}` : '')
      )
    } catch {
      setMailStatus('No se pudo conectar.')
    } finally {
      setMailBusy(false)
    }
  }

  const [casilleros, setCasilleros] = useState<Casillero[]>([])
  const [envios, setEnvios] = useState<Envio[]>([])
  const [loadingCasillero, setLoadingCasillero] = useState(true)
  const [guias, setGuias] = useState<Record<string, string>>({})
  const [despachando, setDespachando] = useState<string | null>(null)

  async function marcarEnviado(e: Envio) {
    const guia = (guias[e.id] ?? '').trim()
    if (!confirm(`¿Marcar como enviado el paquete de ${e.customer?.name ?? 'este cliente'}?`
      + (guia ? `\nGuía: ${guia}` : '\nSin número de guía.'))) return
    setDespachando(e.id)
    try {
      const res = await fetch('/api/admin/casillero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId: e.id, tracking: guia }),
      })
      if (!res.ok) { alert('No se pudo marcar como enviado.'); return }
      setEnvios(prev => prev.map(x =>
        x.id === e.id ? { ...x, status: 'shipped', tracking_number: guia || null } : x
      ))
    } finally {
      setDespachando(null)
    }
  }

  const [figuras, setFiguras] = useState<PreventaFigura[]>([])
  const [loadingPreventas, setLoadingPreventas] = useState(true)
  const [marcando, setMarcando] = useState<string | null>(null)

  async function toggleLlegada(f: PreventaFigura) {
    const marcar = !f.arrivedAt
    if (marcar && f.clientes > 0 && !confirm(
      `¿Marcar "${f.name}" como llegada?\n\n`
      + `Se le habilita el cobro a ${f.clientes} ${f.clientes === 1 ? 'cliente' : 'clientes'}`
      + ` por $${f.pendiente.toLocaleString('es-MX')} MXN en total.`
    )) return

    setMarcando(f.handle)
    try {
      const res = await fetch('/api/admin/preventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: f.handle, arrived: marcar }),
      })
      if (!res.ok) { alert('No se pudo actualizar la figura.'); return }
      setFiguras(prev => prev.map(x =>
        x.handle === f.handle ? { ...x, arrivedAt: marcar ? new Date().toISOString() : null } : x
      ))
    } finally {
      setMarcando(null)
    }
  }

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

    fetch('/api/admin/preventas')
      .then(r => r.ok ? r.json() : { figuras: [] })
      .then(d => { setFiguras(d.figuras ?? []); setLoadingPreventas(false) })
      .catch(() => setLoadingPreventas(false))

    fetch('/api/admin/casillero')
      .then(r => r.ok ? r.json() : { casilleros: [], envios: [] })
      .then(d => {
        setCasilleros(d.casilleros ?? [])
        setEnvios(d.envios ?? [])
        setLoadingCasillero(false)
      })
      .catch(() => setLoadingCasillero(false))
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

      {/* Casillero — qué hay guardado y qué falta empacar */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="truck" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Casillero
            {envios.filter(e => e.status === 'paid').length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#F5C84A', color: '#3A2A00', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>
                {envios.filter(e => e.status === 'paid').length} por empacar
              </span>
            )}
          </h2>
        </div>

        {loadingCasillero ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '16px 0' }}>Cargando…</div>
        ) : (
          <>
            {/* Envíos pagados que faltan mandar */}
            {envios.filter(e => e.status === 'paid').length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Listos para empacar
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {envios.filter(e => e.status === 'paid').map(e => (
                    <div key={e.id} style={{ background: '#FFF8E1', border: '1px solid #F5C84A', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                          {e.customer?.name ?? '—'}
                          {e.customer?.handle && <span style={{ color: 'var(--ink-3)', fontWeight: 400, fontSize: 12 }}> @{e.customer.handle}</span>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#7A5B00' }}>{e.carrier}</div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 8 }}>
                        <strong>Contenido:</strong> {e.contenido.map(c => `${c.title}${c.quantity > 1 ? ` ×${c.quantity}` : ''}`).join(', ') || '—'}
                      </div>

                      {e.shipping && (
                        <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 10 }}>
                          <strong>Enviar a:</strong> {e.shipping.name} · {e.shipping.phone}<br />
                          {[e.shipping.street, e.shipping.numExt].filter(Boolean).join(' ')}
                          {e.shipping.colonia ? `, ${e.shipping.colonia}` : ''}
                          {e.shipping.city ? `, ${e.shipping.city}` : ''}
                          {e.shipping.state ? `, ${e.shipping.state}` : ''}
                          {e.shipping.zip ? ` CP ${e.shipping.zip}` : ''}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          value={guias[e.id] ?? ''}
                          onChange={ev => setGuias(g => ({ ...g, [e.id]: ev.target.value }))}
                          placeholder="Número de guía"
                          className="input"
                          style={{ flex: '1 1 180px', fontSize: 13 }}
                        />
                        <button
                          onClick={() => marcarEnviado(e)}
                          disabled={despachando === e.id}
                          className="btn btn-primary btn-sm"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {despachando === e.id ? '…' : 'Marcar enviado'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lo que sigue esperando en bodega */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Guardado en bodega
            </div>
            {casilleros.length === 0 ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '8px 0' }}>
                Nadie tiene cosas guardadas ahora mismo.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--ink-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '8px 10px 8px 0' }}>Cliente</th>
                      <th style={{ padding: '8px 10px' }}>Contenido</th>
                      <th style={{ padding: '8px 10px' }}>Piezas</th>
                      <th style={{ padding: '8px 0 8px 10px' }}>Más antiguo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casilleros.map(c => {
                      const viejo = c.diasMasViejo >= 60
                      return (
                        <tr key={c.userId} style={{ borderTop: '1px solid var(--line)' }}>
                          <td style={{ padding: '10px 10px 10px 0', color: 'var(--ink)' }}>
                            {c.customer?.name ?? '—'}
                            {c.customer?.handle && (
                              <span style={{ color: 'var(--ink-3)', fontSize: 11, display: 'block' }}>@{c.customer.handle}</span>
                            )}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--ink-2)', fontSize: 12 }}>
                            {c.pedidos.flatMap(p => p.line_items ?? []).map(li => `${li.title}${li.quantity > 1 ? ` ×${li.quantity}` : ''}`).join(', ')}
                          </td>
                          <td style={{ padding: '10px', color: 'var(--ink-2)' }}>{c.piezas}</td>
                          <td style={{ padding: '10px 0 10px 10px', color: viejo ? '#B45309' : 'var(--ink-2)', fontWeight: viejo ? 600 : 400 }}>
                            {c.diasMasViejo === 0 ? 'hoy' : c.diasMasViejo === 1 ? '1 día' : `${c.diasMasViejo} días`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Plantillas de correo */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="user" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Plantillas de correo</h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 14px', lineHeight: 1.6 }}>
          Te manda una copia de cada plantilla a tu correo para revisarlas en Gmail,
          que rompe HTML que en el navegador se ve bien.
        </p>
        <button onClick={enviarPreviews} disabled={mailBusy} className="btn btn-primary btn-sm">
          {mailBusy ? 'Enviando…' : 'Enviarme las plantillas'}
        </button>
        {mailStatus && (
          <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: '10px 0 0', lineHeight: 1.6 }}>{mailStatus}</p>
        )}
      </div>

      {/* Preventas — liberar el cobro del saldo cuando llega la figura */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="clock" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Preventas
            {figuras.filter(f => f.clientes > 0 && !f.arrivedAt).length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>
                {figuras.filter(f => f.clientes > 0 && !f.arrivedAt).length} por llegar
              </span>
            )}
          </h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px', lineHeight: 1.6 }}>
          Marca una figura cuando la tengas en mano: se le habilita el pago del saldo a
          todos los que la apartaron, sin importar cuántos sean.
        </p>

        {loadingPreventas ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '16px 0' }}>Cargando figuras…</div>
        ) : figuras.length === 0 ? (
          <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '16px 0' }}>No hay figuras en preventa.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {figuras.map(f => {
              const llego = !!f.arrivedAt
              return (
                <div key={f.handle} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  background: llego ? '#F0FBF4' : 'var(--cream)',
                  border: `1px solid ${llego ? '#86EFAC' : 'var(--line)'}`,
                }}>
                  {f.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.photo} alt="" width={34} height={34}
                         style={{ objectFit: 'contain', flexShrink: 0, background: '#fff', borderRadius: 6 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                      {f.clientes > 0
                        ? `${f.clientes} ${f.clientes === 1 ? 'cliente espera' : 'clientes esperan'} · $${f.pendiente.toLocaleString('es-MX')} por cobrar`
                        : 'Sin apartados con saldo pendiente'}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLlegada(f)}
                    disabled={marcando === f.handle}
                    className={llego ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {marcando === f.handle ? '…' : llego ? 'Llegó — deshacer' : 'Marcar que llegó'}
                  </button>
                </div>
              )
            })}
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
