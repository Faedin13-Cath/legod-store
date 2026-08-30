'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import MinifigImage from '@/components/product/MinifigImage'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import { PREVENTAS_PUBLIC, amountsFor, type Modalidad } from '@/lib/preventa'
import type { Product } from '@/types'

type Seleccion = { modalidad: Modalidad; qty: number }

function PreventaCardSkeleton() {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden' }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 0 }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton w="80%" h={14} />
        <Skeleton w="45%" h={10} />
        <Skeleton h={40} r={10} style={{ marginTop: 4 }} />
      </div>
    </div>
  )
}

function PreventaCard({
  product, seleccion, onChange,
}: {
  product: Product
  seleccion: Seleccion | undefined
  onChange: (next: Seleccion | null) => void
}) {
  const pv = product.preventa!
  const picked = !!seleccion
  const modalidad = seleccion?.modalidad ?? 'completo'
  const qty = seleccion?.qty ?? 1
  const a = amountsFor(pv, modalidad)
  const maxQty = Math.max(1, Math.min(10, product.stock || 1))

  function toggle() {
    onChange(picked ? null : { modalidad: 'completo', qty: 1 })
  }

  return (
    <article style={{
      background: 'var(--paper)',
      border: `1px solid ${picked ? 'var(--accent)' : 'var(--line)'}`,
      boxShadow: picked ? '0 0 0 3px var(--accent-soft)' : 'none',
      borderRadius: 18, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color .12s, box-shadow .12s',
    }}>
      {/* Foto + selector */}
      <button
        onClick={toggle}
        aria-pressed={picked}
        style={{
          position: 'relative', width: '100%', aspectRatio: '1/1',
          background: '#fff', border: 'none', borderBottom: '1px solid var(--line)',
          cursor: 'pointer', padding: 0, display: 'block',
        }}
      >
        <MinifigImage product={product} />

        {pv.badge && (
          <span style={{
            position: 'absolute', top: 12, left: 12,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '4px 9px', borderRadius: 999,
            background: 'var(--gold)', color: '#3A2A00',
          }}>
            {pv.badge}
          </span>
        )}

        <span style={{
          position: 'absolute', top: 12, right: 12,
          width: 24, height: 24, borderRadius: '50%',
          background: picked ? 'var(--accent)' : 'rgba(255,255,255,0.95)',
          border: `2px solid ${picked ? 'var(--accent)' : 'var(--line)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {picked && <Icon name="check" size={13} color="#fff" />}
        </span>
      </button>

      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px', lineHeight: 1.35 }}>
          {product.name}
        </h3>
        <p style={{ fontSize: 11, color: 'var(--ink-3)', margin: '0 0 10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {product.tag}
        </p>

        {/* Precios */}
        <div style={{ marginBottom: picked ? 12 : 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
            ${pv.full.toLocaleString('es-MX')}
            <small style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 5 }}>completo</small>
          </div>
          {pv.split ? (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
              o ${pv.split.deposit.toLocaleString('es-MX')} ahora + ${pv.split.pending.toLocaleString('es-MX')} al llegar
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>Solo pago completo</div>
          )}
        </div>

        {/* Opciones al seleccionar */}
        {picked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            {pv.split && (
              <div style={{ display: 'flex', gap: 6 }}>
                {([
                  { id: 'completo' as const, label: 'Completo', amount: pv.full },
                  { id: 'split'    as const, label: 'Anticipo', amount: pv.split.deposit },
                ]).map(o => {
                  const on = modalidad === o.id
                  return (
                    <button
                      key={o.id}
                      onClick={() => onChange({ modalidad: o.id, qty })}
                      style={{
                        flex: 1, padding: '7px 6px', borderRadius: 9, cursor: 'pointer',
                        background: on ? 'var(--accent)' : 'var(--cream)',
                        border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                        color: on ? '#fff' : 'var(--ink-2)',
                        fontSize: 11, fontWeight: 600, transition: 'all .12s',
                      }}
                    >
                      {o.label}
                      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, marginTop: 1 }}>
                        ${o.amount.toLocaleString('es-MX')}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '1px solid var(--line)', borderRadius: 9, background: 'var(--cream)',
            }}>
              <button
                onClick={() => onChange({ modalidad, qty: Math.max(1, qty - 1) })}
                disabled={qty <= 1}
                aria-label="Quitar una"
                style={{
                  width: 34, height: 34, background: 'none', border: 'none',
                  cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                  color: qty <= 1 ? 'var(--ink-4)' : 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              ><Icon name="minus" size={13} /></button>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{qty}</span>
              <button
                onClick={() => onChange({ modalidad, qty: Math.min(maxQty, qty + 1) })}
                disabled={qty >= maxQty}
                aria-label="Agregar una"
                style={{
                  width: 34, height: 34, background: 'none', border: 'none',
                  cursor: qty >= maxQty ? 'not-allowed' : 'pointer',
                  color: qty >= maxQty ? 'var(--ink-4)' : 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              ><Icon name="plus" size={13} /></button>
            </div>

            <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
              Pagas hoy <strong style={{ color: 'var(--ink)' }}>${(a.today * qty).toLocaleString('es-MX')}</strong>
              {a.pending > 0 && ` · restan $${(a.pending * qty).toLocaleString('es-MX')}`}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export default function PreventasPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [items,   setItems]   = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [sel,     setSel]     = useState<Record<string, Seleccion>>({})
  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')

  const allowed = PREVENTAS_PUBLIC || !!profile?.is_admin

  useEffect(() => {
    if (!allowed) return
    getProducts()
      .then(ps => setItems(ps.map(shopifyToProduct).filter(p => p.preventa)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [allowed])

  const resumen = useMemo(() => {
    let figuras = 0, hoy = 0, pend = 0
    for (const p of items) {
      const s = sel[p.id]
      if (!s || !p.preventa) continue
      const a = amountsFor(p.preventa, s.modalidad)
      figuras += s.qty
      hoy     += a.today   * s.qty
      pend    += a.pending * s.qty
    }
    return { figuras, hoy, pend }
  }, [items, sel])

  function setSeleccion(handle: string, next: Seleccion | null) {
    setSel(prev => {
      const copy = { ...prev }
      if (next) copy[handle] = next
      else delete copy[handle]
      return copy
    })
  }

  async function reservar() {
    if (!user) { window.location.href = '/login?next=/preventas'; return }
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/checkout/preventa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.entries(sel).map(([handle, s]) => ({ handle, ...s })),
          userId: user.id, userEmail: user.email,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return }
      setError(data.error ?? 'No se pudo generar el pago.')
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 15 }}>
        Cargando…
      </div>
    )
  }

  if (!allowed) {
    return (
      <div style={{ maxWidth: 560, margin: '100px auto', textAlign: 'center', padding: '0 32px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          Preventas — próximamente
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 24, lineHeight: 1.6 }}>
          Estamos preparando esta sección. Muy pronto vas a poder reservar figuras
          antes de que lleguen.
        </p>
        <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          Ir a la tienda
        </Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px 140px' }}>
        {!PREVENTAS_PUBLIC && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FFF8E1', border: '1px solid #F5C84A', borderRadius: 10,
            padding: '10px 14px', marginBottom: 24, fontSize: 13, color: '#7A5B00',
          }}>
            <Icon name="settings" size={15} />
            Vista de administrador — esta sección aún no es visible para los clientes.
          </div>
        )}

        <h1 style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px', lineHeight: 1.15 }}>
          Preventas
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 580 }}>
          Aparta figuras antes de que lleguen. Elige las que quieras: pagas menos si
          liquidas de una vez, o reservas con un anticipo y cubres el resto cuando
          las tengamos en mano.
        </p>

        {loading ? (
          <div className="preventa-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {Array.from({ length: 8 }).map((_, i) => <PreventaCardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 16, padding: '56px', textAlign: 'center',
          }}>
            <div style={{ color: 'var(--ink-4)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
              <Icon name="clock" size={32} />
            </div>
            <p style={{ color: 'var(--ink-3)', margin: 0, fontSize: 14 }}>
              No hay preventas activas en este momento.
            </p>
          </div>
        ) : (
          <div className="preventa-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {items.map(p => (
              <PreventaCard
                key={p.id}
                product={p}
                seleccion={sel[p.id]}
                onChange={next => setSeleccion(p.id, next)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Resumen fijo */}
      {resumen.figuras > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40,
          background: 'var(--paper)', borderTop: '1px solid var(--line)',
          boxShadow: '0 -8px 24px -12px rgba(0,0,0,0.18)',
          padding: '14px 32px',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                {resumen.figuras} {resumen.figuras === 1 ? 'figura' : 'figuras'} seleccionadas
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>
                Pagas hoy ${resumen.hoy.toLocaleString('es-MX')} MXN
                {resumen.pend > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 8 }}>
                    · ${resumen.pend.toLocaleString('es-MX')} al llegar
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {error && (
                <span style={{ fontSize: 13, color: '#DC2626', maxWidth: 280 }}>{error}</span>
              )}
              <button onClick={() => { setSel({}); setError('') }} className="btn btn-secondary btn-sm">
                Limpiar
              </button>
              <button onClick={reservar} disabled={sending} className="btn btn-primary" style={{ height: 44, fontSize: 15, padding: '0 24px' }}>
                {sending ? 'Generando pago…' : 'Reservar →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
