'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import type { CartItem } from '@/types'

interface Props {
  open:        boolean
  items:       CartItem[]
  onClose:     () => void
  onRemove:    (id: string) => void
  onChangeQty: (id: string, qty: number) => void
}

function deadlineLabel(total: number) {
  if (total <= 1000) return '1 semana'
  if (total <= 4000) return '15 días'
  return '1 mes'
}

export default function CartDrawer({ open, items, onClose, onRemove, onChangeQty }: Props) {
  const drawerRef       = useRef<HTMLDivElement>(null)
  const { user, profile } = useAuth()
  const router            = useRouter()
  const [loading,        setLoading]    = useState(false)
  const [loadingApt,     setLoadingApt] = useState(false)
  const [infoOpen,       setInfoOpen]   = useState(false)
  const [useBalance,     setUseBalance] = useState(false)
  const infoRef          = useRef<HTMLDivElement>(null)

  const userBalance = profile?.balance ?? 0

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const count    = items.reduce((s, it) => s + it.qty, 0)
  const deposit  = Math.round(subtotal * 0.40)
  const balance  = subtotal - deposit

  /* ── close info popup on outside click ── */
  useEffect(() => {
    if (!infoOpen) return
    function handler(e: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [infoOpen])

  /* ── Escape key ── */
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* ── body scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function goToCheckout() {
    setLoading(true)
    try {
      const applied  = useBalance ? Math.min(userBalance, subtotal) : 0
      const payload  = applied > 0
        ? { items: items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })), useBalance: true, balanceToUse: applied, userId: user!.id }
        : { items: items.map(i => ({ id: i.id, qty: i.qty })), ...(user?.email ? { userEmail: user.email } : {}) }

      const res  = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error ?? 'No se pudo conectar con Shopify. Verifica que el producto esté agregado en tu tienda.')
        setLoading(false)
      }
    } catch {
      alert('Error al procesar el checkout.')
      setLoading(false)
    }
  }

  async function goToApartado() {
    if (!user) { router.push('/login'); onClose(); return }
    setLoadingApt(true)
    try {
      const res  = await fetch('/api/checkout/apartado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items:    items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          subtotal,
        }),
      })
      const data = await res.json()

      if (!data.checkoutUrl) {
        throw new Error('No se pudo crear el apartado')
      }

      onClose()

      if (data.via === 'whatsapp') {
        // Fallback: no Admin API token — open WhatsApp + redirect to apartados page
        window.open(data.checkoutUrl, '_blank')
        router.push('/apartados')
      } else {
        // Shopify Draft Order invoice: redirect customer to pay deposit there
        window.location.href = data.checkoutUrl
      }
    } catch {
      alert('Error al procesar el apartado. Inténtalo de nuevo.')
      setLoadingApt(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(26,30,90,0.35)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'fadeIn .2s ease',
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
          width: 420, maxWidth: '100vw',
          background: 'var(--paper)',
          borderLeft: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .25s cubic-bezier(.32,.72,0,1)',
          boxShadow: open ? 'var(--shadow-modal)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="cart" size={18} />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Carrito</span>
            {count > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999 }}>
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', cursor: 'pointer' }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, textAlign: 'center' }}>
              <div style={{ color: 'var(--ink-4)', marginBottom: 4 }}><Icon name="cart" size={40} /></div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>Tu carrito está vacío</p>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Agrega minifiguras o sets desde la tienda</p>
              <button onClick={onClose} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <Link href="/tienda" style={{ color: 'inherit', textDecoration: 'none' }}>Explorar tienda</Link>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)' }}>
                  {/* Color chip */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 8, flexShrink: 0,
                    background: item.fig
                      ? `linear-gradient(135deg, ${item.fig.c1} 0%, ${item.fig.c2} 100%)`
                      : 'var(--accent-soft)',
                    border: '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>{item.tag}</div>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--paper)', overflow: 'hidden' }}>
                        <button
                          onClick={() => item.qty <= 1 ? onRemove(item.id) : onChangeQty(item.id, item.qty - 1)}
                          style={{ width: 28, height: 28, background: 'none', border: 'none', color: 'var(--ink-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon name="minus" size={12} />
                        </button>
                        <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{item.qty}</span>
                        <button
                          onClick={() => onChangeQty(item.id, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          style={{ width: 28, height: 28, background: 'none', border: 'none', color: item.qty >= item.stock ? 'var(--ink-4)' : 'var(--ink-2)', cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon name="plus" size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: 'none', border: '1px solid transparent', color: 'var(--ink-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="close" size={13} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>
                    ${(item.price * item.qty).toLocaleString('es-MX')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--line)' }}>

            {/* Subtotal */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: useBalance && userBalance > 0 ? 4 : 0 }}>
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                  Subtotal ({count} {count === 1 ? 'artículo' : 'artículos'})
                </span>
                <span style={{ fontSize: useBalance && userBalance > 0 ? 15 : 22, fontWeight: 700, color: useBalance && userBalance > 0 ? 'var(--ink-3)' : 'var(--ink)', textDecoration: useBalance && userBalance > 0 ? 'line-through' : 'none' }}>
                  ${subtotal.toLocaleString('es-MX')}
                  <small style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 3 }}>MXN</small>
                </span>
              </div>
              {useBalance && userBalance > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--accent)' }}>Saldo aplicado</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      −${Math.min(userBalance, subtotal).toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Total a pagar</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)' }}>
                      ${Math.max(0, subtotal - Math.min(userBalance, subtotal)).toLocaleString('es-MX')}
                      <small style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 3 }}>MXN</small>
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Saldo section — always visible when logged in */}
            {user && (
              userBalance > 0 ? (
                <button
                  onClick={() => setUseBalance(v => !v)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 13px', borderRadius: 10, marginBottom: 10,
                    background: useBalance ? 'var(--accent-soft)' : 'var(--cream)',
                    border: `1px solid ${useBalance ? 'var(--accent)' : 'var(--line)'}`,
                    cursor: 'pointer', transition: 'all .12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                      background: useBalance ? 'var(--accent)' : 'var(--paper)',
                      border: `2px solid ${useBalance ? 'var(--accent)' : 'var(--line)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {useBalance && <Icon name="check" size={9} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: useBalance ? 'var(--accent)' : 'var(--ink-2)' }}>
                      Usar mi saldo
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: useBalance ? 'var(--accent)' : 'var(--ink-3)' }}>
                    ${userBalance.toLocaleString('es-MX')} disponibles
                  </span>
                </button>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 13px', borderRadius: 10, marginBottom: 10,
                  background: 'var(--cream)', border: '1px solid var(--line)',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 1 }}>Tu saldo</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-3)' }}>$0 MXN</div>
                  </div>
                  <Link
                    href="/saldo"
                    onClick={onClose}
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none', fontSize: 12 }}
                  >
                    Agregar saldo
                  </Link>
                </div>
              )
            )}

            {/* Full payment button */}
            <button
              onClick={goToCheckout}
              disabled={loading || loadingApt}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, height: 48, opacity: (loading || loadingApt) ? 0.7 : 1, marginBottom: 8 }}
            >
              {loading ? 'Conectando…' : 'Pagar completo →'}
            </button>

            {/* Apartar row: button + info icon */}
            <div style={{ position: 'relative', marginBottom: 8 }} ref={infoRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={goToApartado}
                  disabled={loading || loadingApt}
                  style={{
                    flex: 1, height: 44, borderRadius: 10,
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent)',
                    color: 'var(--accent)', fontSize: 14, fontWeight: 600,
                    cursor: (loading || loadingApt) ? 'not-allowed' : 'pointer',
                    opacity: (loading || loadingApt) ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background .12s',
                  }}
                >
                  {loadingApt ? 'Procesando…' : (
                    <>
                      Apartar con 40%
                      <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>
                        (${deposit.toLocaleString('es-MX')} MXN)
                      </span>
                    </>
                  )}
                </button>

                {/* Info icon */}
                <button
                  onClick={() => setInfoOpen(v => !v)}
                  aria-label="¿Cómo funciona el apartado?"
                  style={{
                    width: 36, height: 44, borderRadius: 10, flexShrink: 0,
                    background: infoOpen ? 'var(--accent)' : 'var(--cream)',
                    border: `1px solid ${infoOpen ? 'var(--accent)' : 'var(--line)'}`,
                    color: infoOpen ? '#fff' : 'var(--ink-3)',
                    cursor: 'pointer', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                  }}
                >
                  ℹ
                </button>
              </div>

              {/* Info popup */}
              {infoOpen && (
                <div style={{
                  position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                  width: 280, borderRadius: 14,
                  background: 'var(--paper)',
                  border: '1px solid var(--accent)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: '16px 18px',
                  zIndex: 10,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                    ¿Cómo funciona el apartado?
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: '0 0 12px', lineHeight: 1.6 }}>
                    Pagas el <strong>40%</strong> hoy para reservar tus figuras. Tienes plazo para liquidar el resto según el monto total:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {[
                      { range: 'Hasta $1,000',         time: '1 semana',  active: subtotal <= 1000 },
                      { range: '$1,001 — $4,000',      time: '15 días',   active: subtotal > 1000 && subtotal <= 4000 },
                      { range: 'Más de $4,000',        time: '1 mes',     active: subtotal > 4000 },
                    ].map(row => (
                      <div key={row.range} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 10px', borderRadius: 8,
                        background: row.active ? 'var(--accent-soft)' : 'var(--cream)',
                        border: `1px solid ${row.active ? 'var(--accent)' : 'var(--line)'}`,
                      }}>
                        <span style={{ fontSize: 11, color: row.active ? 'var(--accent)' : 'var(--ink-3)', fontWeight: row.active ? 600 : 400 }}>
                          {row.range}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: row.active ? 'var(--accent)' : 'var(--ink-2)' }}>
                          {row.time}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Current order summary */}
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>
                      <span>Tu anticipo (40%)</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>${deposit.toLocaleString('es-MX')} MXN</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)' }}>
                      <span>Saldo al liquidar</span>
                      <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>${balance.toLocaleString('es-MX')} MXN</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 3 }}>
                      <span style={{ color: 'var(--ink-3)' }}>Tienes hasta</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{deadlineLabel(subtotal)}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--ink-4)', margin: '10px 0 0', lineHeight: 1.5 }}>
                    Si no se liquida en el plazo, el apartado se pierde. Te contactamos por WhatsApp antes de que venza.
                  </p>
                </div>
              )}
            </div>

            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', fontSize: 14 }}>
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
