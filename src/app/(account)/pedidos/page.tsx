'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
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
  id: string; items: { id?: string; name: string; qty: number }[]
  subtotal: number; deposit: number; balance: number
  deadline_at: string; status: string; created_at: string
}
type Preventa = {
  id: string; items: { id: string; name: string; qty: number; pendiente?: number }[]
  total: number; pagado: number; pendiente: number; status: string; created_at: string
}

const CARRIER_URL: Record<string, string> = {
  'Estafeta': 'https://www.estafeta.com/herramientas/rastreo?wayBillType=1&waybill=',
  'FedEx':    'https://www.fedex.com/fedextrack/?trknbr=',
  'Correos de México': 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Rastreo.aspx?num=',
}

const fecha = (d: string) =>
  new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

/** Pieza tal como se dibuja, venga de un pedido, un apartado o una preventa. */
type Pieza = { nombre: string; qty: number; handle?: string }

const piezasDePedido = (o: Order): Pieza[] =>
  (o.line_items ?? []).map(li => ({ nombre: li.title, qty: li.quantity ?? 1 }))

const piezasDeLista = (items: { id?: string; name: string; qty: number }[]): Pieza[] =>
  (items ?? []).map(i => ({ nombre: i.name, qty: i.qty ?? 1, handle: i.id }))

export default function MisPedidosPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [orders,    setOrders]    = useState<Order[]>([])
  const [apartados, setApartados] = useState<Apartado[]>([])
  const [preventas, setPreventas] = useState<Preventa[]>([])
  const [llegadas,  setLlegadas]  = useState<Set<string>>(new Set())
  const [fotos,     setFotos]     = useState<Record<string, string>>({})
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('todo')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      fetch('/api/orders').then(r => r.ok ? r.json() : { orders: [] }),
      supabase.from('apartados').select('*').eq('user_id', user.id).eq('status', 'active'),
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

  // Los pedidos solo guardan el título de la figura, no su foto. Se arma un
  // índice del catálogo por handle y por nombre para poder ilustrarlos.
  useEffect(() => {
    getProducts()
      .then(ps => {
        const map: Record<string, string> = {}
        for (const raw of ps) {
          const p = shopifyToProduct(raw)
          if (!p.photo) continue
          map[p.id] = p.photo
          map[p.name.toLowerCase().trim()] = p.photo
        }
        setFotos(map)
      })
      .catch(() => {})
  }, [])

  const fotoDe = (pieza: Pieza) =>
    (pieza.handle && fotos[pieza.handle]) || fotos[pieza.nombre.toLowerCase().trim()] || null

  const { guardadas, enCamino, enviadas } = useMemo(() => ({
    guardadas: orders.filter(o => o.carrier === CASILLERO && !o.shipment_id),
    enCamino:  orders.filter(o => o.carrier !== CASILLERO && o.fulfillment_status !== 'fulfilled'),
    enviadas:  orders.filter(o => o.fulfillment_status === 'fulfilled'),
  }), [orders])

  const preventasVivas = preventas.filter(p => p.status === 'active')

  const secciones = [
    { id: 'casillero', icon: 'truck',   titulo: 'En tu casillero', cuenta: guardadas.length },
    { id: 'apartados', icon: 'clock',   titulo: 'Apartados',       cuenta: apartados.length },
    { id: 'preventas', icon: 'package', titulo: 'Preventas',       cuenta: preventasVivas.length },
    { id: 'camino',    icon: 'clock',   titulo: 'En preparación',  cuenta: enCamino.length },
    { id: 'enviados',  icon: 'check',   titulo: 'Enviados',        cuenta: enviadas.length },
  ].filter(s => s.cuenta > 0)

  const total = secciones.reduce((s, x) => s + x.cuenta, 0)
  const ver = (id: string) => tab === 'todo' || tab === id

  /* ── Piezas de una tarjeta, con foto ── */
  function Piezas({ piezas }: { piezas: Pieza[] }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {piezas.map((p, i) => {
          const foto = fotoDe(p)
          return (
            <div key={`${p.nombre}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                background: '#fff', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative',
              }}>
                {foto
                  ? <Image src={foto} alt="" fill sizes="46px" style={{ objectFit: 'contain', padding: 4 }} />
                  : <span style={{ color: 'var(--ink-4)' }}><Icon name="package" size={18} /></span>}
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.35 }}>
                {p.nombre}
                {p.qty > 1 && <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}> ×{p.qty}</span>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function Tarjeta({ piezas, meta, derecha, pie }: {
    piezas: Pieza[]; meta: React.ReactNode; derecha?: React.ReactNode; pie?: React.ReactNode
  }) {
    return (
      <div style={{
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 14, padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Piezas piezas={piezas} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 10 }}>{meta}</div>
          </div>
          {derecha && <div style={{ flexShrink: 0, textAlign: 'right' }}>{derecha}</div>}
        </div>
        {pie && <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line-soft)' }}>{pie}</div>}
      </div>
    )
  }

  function Bloque({ id, icon, titulo, nota, cta, children }: {
    id: string; icon: string; titulo: string; nota?: string
    cta?: { href: string; label: string }; children: React.ReactNode
  }) {
    const s = secciones.find(x => x.id === id)
    if (!s || !ver(id)) return null
    return (
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: nota ? 3 : 12 }}>
          <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon name={icon} size={16} /></span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{titulo}</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>({s.cuenta})</span>
        </div>
        {nota && <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 12px', lineHeight: 1.55 }}>{nota}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
        {cta && (
          <Link href={cta.href} className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 12 }}>
            {cta.label}
          </Link>
        )}
      </section>
    )
  }

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
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px', lineHeight: 1.5 }}>
        Todo lo que compraste, en el estado en que está.
      </p>

      {/* Submenú: con una sola sección no aporta nada, así que solo aparece
          cuando hay algo entre qué elegir. */}
      {secciones.length > 1 && (
        <nav style={{
          display: 'flex', gap: 8, marginBottom: 26, overflowX: 'auto',
          paddingBottom: 4, scrollbarWidth: 'none',
        }} className="pedidos-tabs">
          {[{ id: 'todo', icon: 'grid', titulo: 'Todo', cuenta: total }, ...secciones].map(s => {
            const on = tab === s.id
            return (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                  padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                  fontSize: 13, fontWeight: on ? 700 : 500,
                  color: on ? '#fff' : 'var(--ink-2)',
                  background: on ? 'var(--accent)' : 'var(--paper)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                  whiteSpace: 'nowrap', transition: 'all .12s',
                }}
              >
                <Icon name={s.icon} size={13} />
                {s.titulo}
                <span style={{ opacity: 0.7, fontWeight: 500 }}>{s.cuenta}</span>
              </button>
            )
          })}
        </nav>
      )}

      <Bloque
        id="casillero" icon="truck" titulo="En tu casillero"
        nota="Te las estamos guardando. Pide el envío cuando quieras y pagas una sola vez."
        cta={{ href: '/casillero', label: 'Pedir mi envío →' }}
      >
        {guardadas.map(o => (
          <Tarjeta
            key={o.id}
            piezas={piezasDePedido(o)}
            meta={<>Pedido #{o.order_number} · guardado desde el {fecha(o.created_at)}</>}
          />
        ))}
      </Bloque>

      <Bloque
        id="apartados" icon="clock" titulo="Apartados"
        nota="Ya diste el anticipo. Te guardamos la figura hasta que liquides."
        cta={{ href: '/apartados', label: 'Liquidar apartado →' }}
      >
        {apartados.map(a => {
          const vencido = new Date(a.deadline_at).getTime() < Date.now()
          const dias = Math.ceil((new Date(a.deadline_at).getTime() - Date.now()) / 86_400_000)
          const pct = a.subtotal > 0 ? Math.round((a.deposit / a.subtotal) * 100) : 0
          return (
            <Tarjeta
              key={a.id}
              piezas={piezasDeLista(a.items)}
              meta={
                <span style={{ color: vencido ? 'var(--danger)' : 'var(--ink-3)' }}>
                  {vencido ? 'Plazo vencido' : `${dias} ${dias === 1 ? 'día' : 'días'} para liquidar`}
                </span>
              }
              derecha={
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                    ${a.balance.toLocaleString('es-MX')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>por pagar</div>
                </>
              }
              pie={
                <>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: vencido ? 'var(--danger)' : 'var(--accent)', borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 5 }}>
                    Pagaste ${a.deposit.toLocaleString('es-MX')} de ${a.subtotal.toLocaleString('es-MX')} MXN
                  </div>
                </>
              }
            />
          )
        })}
      </Bloque>

      <Bloque
        id="preventas" icon="package" titulo="Preventas"
        nota={`Figuras que aún no llegan a la tienda. Llegada tentativa: ${LLEGADA_TENTATIVA} (puede tardar más).`}
        cta={{ href: '/mis-preventas', label: 'Ver mis preventas →' }}
      >
        {preventasVivas.map(p => {
          const cobrables = (p.items ?? []).filter(i => (i.pendiente ?? 0) > 0 && llegadas.has(i.id))
          const porPagar  = cobrables.reduce((s, i) => s + (i.pendiente ?? 0), 0)
          const pct = p.total > 0 ? Math.round((p.pagado / p.total) * 100) : 0
          return (
            <Tarjeta
              key={p.id}
              piezas={piezasDeLista(p.items)}
              meta={
                <span style={{ color: porPagar > 0 ? 'var(--warning)' : 'var(--ink-3)' }}>
                  {porPagar > 0
                    ? `Ya llegó parte de tu pedido: puedes pagar $${porPagar.toLocaleString('es-MX')}`
                    : 'Todavía en camino a la tienda'}
                </span>
              }
              derecha={p.pendiente > 0 ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                    ${p.pendiente.toLocaleString('es-MX')}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>por pagar</div>
                </>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>Pagada</div>
              )}
              pie={
                <>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 5 }}>
                    Pagaste ${p.pagado.toLocaleString('es-MX')} de ${p.total.toLocaleString('es-MX')} MXN
                  </div>
                </>
              }
            />
          )
        })}
      </Bloque>

      <Bloque id="camino" icon="clock" titulo="En preparación">
        {enCamino.map(o => (
          <Tarjeta
            key={o.id}
            piezas={piezasDePedido(o)}
            meta={<>Pedido #{o.order_number} · {fecha(o.created_at)}{o.carrier ? ` · ${o.carrier}` : ''}</>}
            derecha={
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                ${Number(o.total_price).toLocaleString('es-MX')}
              </div>
            }
          />
        ))}
      </Bloque>

      <Bloque id="enviados" icon="check" titulo="Enviados">
        {enviadas.map(o => {
          const url = o.carrier && o.tracking_number
            ? (CARRIER_URL[o.carrier] ?? '') + o.tracking_number : null
          return (
            <Tarjeta
              key={o.id}
              piezas={piezasDePedido(o)}
              meta={
                <>
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
                </>
              }
              derecha={
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                  ${Number(o.total_price).toLocaleString('es-MX')}
                </div>
              }
            />
          )
        })}
      </Bloque>
    </div>
  )
}
