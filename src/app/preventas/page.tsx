'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import MinifigImage from '@/components/product/MinifigImage'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import { PREVENTAS_PUBLIC, LLEGADA_TENTATIVA, amountsFor, type Modalidad } from '@/lib/preventa'
import type { Product } from '@/types'

type Seleccion = { modalidad: Modalidad; qty: number }

function PreventaCardSkeleton() {
  return (
    <div className="preventa-card" style={{
      background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: 20, overflow: 'hidden',
      display: 'grid', gridTemplateColumns: '220px 1fr',
    }}>
      <div className="skeleton" style={{ minHeight: 240, borderRadius: 0 }} />
      <div style={{ padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton w="60%" h={20} />
        <Skeleton w="25%" h={11} />
        <Skeleton h={56} r={12} style={{ marginTop: 6 }} />
        <Skeleton h={56} r={12} />
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
  const qty = seleccion?.qty ?? 1
  const agotada = product.stock <= 0
  const maxQty = Math.max(1, Math.min(10, product.stock))

  /**
   * El número grande de cada opción es SIEMPRE el total, nunca el anticipo.
   * Antes el pago diferido enseñaba su anticipo en la misma tipografía que el
   * precio completo ($600 contra $450) y se leía como la opción barata, cuando
   * en realidad sale $150 más cara. Comparar total contra total es lo único
   * honesto; lo que se cobra hoy va debajo, en letra chica.
   */
  const options: {
    id: Modalidad; label: string; sub: string
    total: number; badge: string | null
  }[] = [
    {
      id: 'completo', label: 'Pagar todo ahora',
      total: pv.full,
      sub: !pv.split
        ? 'Esta figura solo se puede pagar completa.'
        : 'Se liquida hoy y ya no debes nada.',
      badge: pv.split && pv.split.surcharge > 0
        ? `Ahorras $${pv.split.surcharge.toLocaleString('es-MX')}`
        : null,
    },
    ...(pv.split ? [{
      id: 'split' as const, label: 'Pagar en dos partes',
      total: pv.split.total,
      sub: `Hoy $${pv.split.deposit.toLocaleString('es-MX')} (${pv.split.pct}%)`
         + ` · $${pv.split.pending.toLocaleString('es-MX')} cuando llegue`,
      badge: null,
    }] : []),
  ]

  /** Clic en la opción activa = quitar la figura de la selección. */
  function pick(id: Modalidad) {
    if (agotada) return
    if (seleccion?.modalidad === id) onChange(null)
    else onChange({ modalidad: id, qty: Math.min(qty, maxQty) })
  }

  const a = seleccion ? amountsFor(pv, seleccion.modalidad) : null

  return (
    <article className="preventa-card" style={{
      background: 'var(--paper)',
      border: `1px solid ${picked ? 'var(--accent)' : 'var(--line)'}`,
      boxShadow: picked ? '0 0 0 3px var(--accent-soft)' : 'none',
      borderRadius: 20, overflow: 'hidden',
      display: 'grid', gridTemplateColumns: '220px 1fr',
      transition: 'border-color .12s, box-shadow .12s',
      opacity: agotada ? 0.6 : 1,
    }}>
      <div style={{
        background: '#fff', borderRight: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 260, position: 'relative',
      }}>
        <MinifigImage product={product} />
        <span style={{
          position: 'absolute', top: 14, left: 14,
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 999,
          background: agotada ? 'var(--ink-3)' : pv.badge ? 'var(--gold)' : 'var(--accent)',
          color: agotada ? '#fff' : pv.badge ? '#3A2A00' : '#fff',
        }}>
          {agotada ? 'Agotada' : pv.badge ?? 'Preventa'}
        </span>
      </div>

      <div style={{ padding: '24px 26px' }}>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.2 }}>
          {product.name}
        </h2>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', margin: '0 0 18px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {product.tag}
          {/* Va aquí y no sobre la foto porque ese lugar ya lo ocupa "Preventa",
              y de las dos cosas la que el cliente necesita saber primero es que
              la figura todavía no llega. */}
          {(['nuevo', 'sellado'] as const)
            .filter(t => product.tags.includes(t))
            .map(t => (
              <span key={t} style={{
                marginLeft: 8, padding: '2px 7px', borderRadius: 999,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              }}>
                {t === 'nuevo' ? 'Nuevo' : 'Sellado'}
              </span>
            ))}
          {!agotada && product.stock <= 5 && (
            <span style={{ color: 'var(--accent)', marginLeft: 8 }}>
              · {product.stock === 1 ? 'Queda 1' : `Quedan ${product.stock}`}
            </span>
          )}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map(o => {
            const on = seleccion?.modalidad === o.id
            return (
              <button
                key={o.id}
                onClick={() => pick(o.id)}
                aria-pressed={on}
                disabled={agotada}
                style={{
                  textAlign: 'left', width: '100%',
                  cursor: agotada ? 'not-allowed' : 'pointer',
                  padding: '14px 16px', borderRadius: 12,
                  background: on ? 'var(--accent-soft)' : 'var(--cream)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                  transition: 'all .12s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                  background: on ? 'var(--accent)' : 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Icon name="check" size={10} color="#fff" />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: on ? 'var(--accent)' : 'var(--ink)' }}>
                      {o.label}
                    </span>
                    {o.badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                        padding: '2px 7px', borderRadius: 999,
                        background: 'var(--gold)', color: '#3A2A00',
                      }}>
                        {o.badge}
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                    {o.sub}
                  </span>
                </span>
                <span style={{ flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>
                    ${o.total.toLocaleString('es-MX')}
                  </span>
                  <span style={{
                    display: 'block', fontSize: 10, fontWeight: 600, marginTop: 1,
                    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)',
                  }}>
                    total
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {picked && a && (
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: '1px solid var(--line)', borderRadius: 10, background: 'var(--cream)',
            }}>
              <button
                onClick={() => onChange({ modalidad: seleccion.modalidad, qty: Math.max(1, qty - 1) })}
                disabled={qty <= 1}
                aria-label="Quitar una"
                style={{
                  width: 36, height: 38, background: 'none', border: 'none',
                  cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                  color: qty <= 1 ? 'var(--ink-4)' : 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              ><Icon name="minus" size={13} /></button>
              <span style={{ width: 34, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{qty}</span>
              <button
                onClick={() => onChange({ modalidad: seleccion.modalidad, qty: Math.min(maxQty, qty + 1) })}
                disabled={qty >= maxQty}
                aria-label="Agregar una"
                style={{
                  width: 36, height: 38, background: 'none', border: 'none',
                  cursor: qty >= maxQty ? 'not-allowed' : 'pointer',
                  color: qty >= maxQty ? 'var(--ink-4)' : 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              ><Icon name="plus" size={13} /></button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              Pagas hoy <strong style={{ color: 'var(--ink)' }}>${(a.today * qty).toLocaleString('es-MX')} MXN</strong>
              {a.pending > 0 && ` · restan $${(a.pending * qty).toLocaleString('es-MX')}`}
            </div>

            <button
              onClick={() => onChange(null)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, color: 'var(--ink-3)', textDecoration: 'underline', padding: 4,
              }}
            >
              Quitar
            </button>
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
  const [needsLogin, setNeedsLogin] = useState(false)

  const allowed = PREVENTAS_PUBLIC || !!profile?.is_admin

  useEffect(() => {
    if (!allowed) return
    getProducts()
      // Las agotadas se esconden: una tarjeta que ya no se puede apartar solo
      // le roba atención a las que sí. Vuelven solas si se repone inventario.
      .then(ps => setItems(ps.map(shopifyToProduct).filter(p => p.preventa && p.stock > 0)))
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
    setNeedsLogin(false)
    setSel(prev => {
      const copy = { ...prev }
      if (next) copy[handle] = next
      else delete copy[handle]
      return copy
    })
  }

  async function reservar() {
    // Ver el catálogo es libre; apartar necesita cuenta para poder ligar la
    // preventa a alguien. En vez de mandarlo al login de golpe, se le avisa.
    if (!user) { setNeedsLogin(true); return }
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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px 140px' }}>
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
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.6, maxWidth: 580 }}>
          Aparta figuras antes de que lleguen. Elige las que quieras y cómo pagarlas:
          todo de una vez, o un anticipo hoy y el resto cuando las tengamos en mano.
          El precio grande de cada opción es el total.
        </p>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderLeft: '1px solid var(--line)', borderRadius: 12,
          padding: '14px 18px', marginBottom: 32, maxWidth: 580,
        }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>
            <Icon name="truck" size={17} />
          </span>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>Llegada tentativa: {LLEGADA_TENTATIVA}.</strong>{' '}
            Es una estimación, no una fecha garantizada: los envíos se retrasan seguido
            y pueden tardar más. Te avisamos por WhatsApp en cuanto lleguen.
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {Array.from({ length: 4 }).map((_, i) => <PreventaCardSkeleton key={i} />)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
            maxWidth: 900, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                {resumen.figuras} {resumen.figuras === 1 ? 'figura seleccionada' : 'figuras seleccionadas'}
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
              {needsLogin ? (
                <>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: 260 }}>
                    Necesitas una cuenta para apartar.
                  </span>
                  <Link
                    href="/login?next=/preventas"
                    className="btn btn-primary"
                    style={{ height: 44, fontSize: 15, padding: '0 24px', textDecoration: 'none' }}
                  >
                    Iniciar sesión →
                  </Link>
                </>
              ) : (
                <>
                  <button onClick={() => { setSel({}); setError('') }} className="btn btn-secondary btn-sm">
                    Limpiar
                  </button>
                  <button onClick={reservar} disabled={sending} className="btn btn-primary" style={{ height: 44, fontSize: 15, padding: '0 24px' }}>
                    {sending ? 'Generando pago…' : 'Reservar →'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
