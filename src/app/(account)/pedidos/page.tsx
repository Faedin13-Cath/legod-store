'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { CASILLERO } from '@/lib/shipping'
import { LLEGADA_TENTATIVA } from '@/lib/preventa'

type LineItem = { title: string; quantity: number; price: string }
type Order = {
  id: string; order_number: string; total_price: number
  fulfillment_status: string; tracking_number: string | null; carrier: string | null
  shipment_id: string | null
  line_items: LineItem[]; created_at: string
}
type Apartado = {
  id: string; items: { name: string; qty: number }[]
  subtotal: number; deposit: number; balance: number
  deadline_at: string; status: string
}
type Preventa = {
  id: string; items: { id: string; name: string; qty: number; pendiente?: number }[]
  total: number; pagado: number; pendiente: number; status: string
}

const CARRIER_URL: Record<string, string> = {
  'Estafeta': 'https://www.estafeta.com/herramientas/rastreo?wayBillType=1&waybill=',
  'FedEx':    'https://www.fedex.com/fedextrack/?trknbr=',
  'Correos de México': 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Rastreo.aspx?num=',
}

const fecha = (d: string) =>
  new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

const piezasDe = (items: { title?: string; name?: string; quantity?: number; qty?: number }[]) =>
  items.map(i => `${i.title ?? i.name}${(i.quantity ?? i.qty ?? 1) > 1 ? ` ×${i.quantity ?? i.qty}` : ''}`).join(', ')

/** Cabecera de bloque con su cuenta, para poder escanear la página de un vistazo. */
function Bloque({ icon, titulo, cuenta, nota, children }: {
  icon: string; titulo: string; cuenta: number; nota?: string; children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{ color: 'var(--accent)', alignSelf: 'center', display: 'flex' }}>
          <Icon name={icon} size={16} />
        </span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{titulo}</h2>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>({cuenta})</span>
      </div>
      {nota && (
        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 12px', lineHeight: 1.5 }}>{nota}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: nota ? 0 : 12 }}>
        {children}
      </div>
    </section>
  )
}

function Tarjeta({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: 14, padding: '14px 18px',
    }}>
      {children}
    </div>
  )
}

export default function MisPedidosPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [orders,    setOrders]    = useState<Order[]>([])
  const [apartados, setApartados] = useState<Apartado[]>([])
  const [preventas, setPreventas] = useState<Preventa[]>([])
  const [llegadas,  setLlegadas]  = useState<Set<string>>(new Set())
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      fetch('/api/orders').then(r => r.ok ? r.json() : { orders: [] }),
      supabase.from('apartados').select('*').eq('user_id', user.id).in('status', ['active']),
      supabase.from('preventas').select('*').eq('user_id', user.id).in('status', ['active', 'completed']),
      supabase.from('preventa_arrivals').select('handle'),
    ]).then(([o, ap, pv, arr]) => {
      setOrders(o.orders ?? [])
      setApartados((ap.data ?? []) as Apartado[])
      setPreventas((pv.data ?? []) as Preventa[])
      setLlegadas(new Set((arr.data ?? []).map(a => a.handle as string)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const { guardadas, enCamino, entregadas } = useMemo(() => ({
    guardadas:  orders.filter(o => o.carrier === CASILLERO && !o.shipment_id),
    enCamino:   orders.filter(o => o.carrier !== CASILLERO && o.fulfillment_status !== 'fulfilled'),
    entregadas: orders.filter(o => o.fulfillment_status === 'fulfilled'),
  }), [orders])

  const preventasVivas = preventas.filter(p => p.status === 'active')
  const total = guardadas.length + enCamino.length + entregadas.length
              + apartados.length + preventasVivas.length

  if (loading) return (
    <div style={{ color: 'var(--ink-3)', fontSize: 15, padding: '40px 0' }}>Cargando…</div>
  )

  if (total === 0) return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 24px' }}>Mis pedidos</h1>
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: 56, textAlign: 'center' }}>
        <div style={{ color: 'var(--ink-4)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Icon name="package" size={32} />
        </div>
        <p style={{ color: 'var(--ink-3)', margin: '0 0 16px' }}>Aún no tienes pedidos.</p>
        <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          Ver tienda
        </Link>
      </div>
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>Mis pedidos</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 26px', lineHeight: 1.5 }}>
        Todo lo que compraste, en el estado en que está.
      </p>

      {/* Guardadas en el casillero */}
      {guardadas.length > 0 && (
        <Bloque
          icon="truck" titulo="En tu casillero" cuenta={guardadas.length}
          nota="Te las estamos guardando. Pide el envío cuando quieras y pagas una sola vez."
        >
          {guardadas.map(o => (
            <Tarjeta key={o.id}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
                {piezasDe(o.line_items ?? [])}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Pedido #{o.order_number} · {fecha(o.created_at)}
              </div>
            </Tarjeta>
          ))}
          <Link href="/casillero" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
            Pedir mi envío →
          </Link>
        </Bloque>
      )}

      {/* Apartados con saldo */}
      {apartados.length > 0 && (
        <Bloque
          icon="clock" titulo="Apartados" cuenta={apartados.length}
          nota="Ya diste el anticipo. Te guardamos la figura hasta que liquides."
        >
          {apartados.map(a => {
            const vencido = new Date(a.deadline_at).getTime() < Date.now()
            const dias = Math.ceil((new Date(a.deadline_at).getTime() - Date.now()) / 86_400_000)
            return (
              <Tarjeta key={a.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{piezasDe(a.items ?? [])}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    Faltan ${a.balance.toLocaleString('es-MX')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: vencido ? 'var(--danger)' : 'var(--ink-3)' }}>
                  {vencido ? 'Plazo vencido' : `${dias} ${dias === 1 ? 'día' : 'días'} para liquidar`}
                </div>
              </Tarjeta>
            )
          })}
          <Link href="/apartados" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
            Liquidar apartado →
          </Link>
        </Bloque>
      )}

      {/* Preventas */}
      {preventasVivas.length > 0 && (
        <Bloque
          icon="package" titulo="Preventas" cuenta={preventasVivas.length}
          nota={`Figuras que aún no llegan a la tienda. Llegada tentativa: ${LLEGADA_TENTATIVA} (puede tardar más).`}
        >
          {preventasVivas.map(p => {
            const cobrables = (p.items ?? []).filter(i => (i.pendiente ?? 0) > 0 && llegadas.has(i.id))
            const porPagar  = cobrables.reduce((s, i) => s + (i.pendiente ?? 0), 0)
            return (
              <Tarjeta key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{piezasDe(p.items ?? [])}</span>
                  {p.pendiente > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                      Faltan ${p.pendiente.toLocaleString('es-MX')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: porPagar > 0 ? '#8A5B0A' : 'var(--ink-3)' }}>
                  {porPagar > 0
                    ? `Ya llegó parte de tu pedido: puedes pagar $${porPagar.toLocaleString('es-MX')}`
                    : 'Todavía en camino a la tienda'}
                </div>
              </Tarjeta>
            )
          })}
          <Link href="/mis-preventas" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
            Ver mis preventas →
          </Link>
        </Bloque>
      )}

      {/* En camino */}
      {enCamino.length > 0 && (
        <Bloque icon="clock" titulo="En preparación" cuenta={enCamino.length}>
          {enCamino.map(o => (
            <Tarjeta key={o.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{piezasDe(o.line_items ?? [])}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                  ${Number(o.total_price).toLocaleString('es-MX')} MXN
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                Pedido #{o.order_number} · {fecha(o.created_at)}
                {o.carrier ? ` · ${o.carrier}` : ''}
              </div>
            </Tarjeta>
          ))}
        </Bloque>
      )}

      {/* Entregadas */}
      {entregadas.length > 0 && (
        <Bloque icon="check" titulo="Enviados" cuenta={entregadas.length}>
          {entregadas.map(o => {
            const url = o.carrier && o.tracking_number
              ? (CARRIER_URL[o.carrier] ?? '') + o.tracking_number : null
            return (
              <Tarjeta key={o.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{piezasDe(o.line_items ?? [])}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                    ${Number(o.total_price).toLocaleString('es-MX')} MXN
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  Pedido #{o.order_number} · {fecha(o.created_at)}
                  {o.tracking_number && (
                    <> · {o.carrier} ·{' '}
                      {url
                        ? <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                            {o.tracking_number} → rastrear
                          </a>
                        : o.tracking_number}
                    </>
                  )}
                </div>
              </Tarjeta>
            )
          })}
        </Bloque>
      )}
    </div>
  )
}
