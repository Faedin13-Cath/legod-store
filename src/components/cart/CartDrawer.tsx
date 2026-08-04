'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import type { CartItem } from '@/types'

interface Props {
  open:    boolean
  items:   CartItem[]
  onClose: () => void
  onRemove: (id: string) => void
  onChangeQty: (id: string, qty: number) => void
}

export default function CartDrawer({ open, items, onClose, onRemove, onChangeQty }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function goToCheckout() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(i => ({ id: i.id, qty: i.qty })) }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert('No se pudo conectar con Shopify. Verifica que el producto esté agregado en tu tienda.')
        setLoading(false)
      }
    } catch {
      alert('Error al procesar el checkout.')
      setLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0)
  const count    = items.reduce((s, it) => s + it.qty, 0)

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
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
              Carrito
            </span>
            {count > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'var(--accent)', color: '#fff',
                padding: '2px 8px', borderRadius: 999,
              }}>
                {count}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'var(--cream)', border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--ink-2)', cursor: 'pointer',
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 12, textAlign: 'center',
            }}>
              <div style={{ color: 'var(--ink-4)', marginBottom: 4 }}>
                <Icon name="cart" size={40} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-2)', margin: 0 }}>
                Tu carrito está vacío
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
                Agrega minifiguras o sets desde la tienda
              </p>
              <button onClick={onClose} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                <Link href="/tienda" style={{ color: 'inherit', textDecoration: 'none' }}>
                  Explorar tienda
                </Link>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: 12,
                  background: 'var(--cream)', border: '1px solid var(--line)',
                }}>
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
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 8 }}>
                      {item.tag}
                    </div>
                    {/* Qty controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center',
                        border: '1px solid var(--line)', borderRadius: 8,
                        background: 'var(--paper)', overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => item.qty <= 1 ? onRemove(item.id) : onChangeQty(item.id, item.qty - 1)}
                          style={{
                            width: 28, height: 28, background: 'none', border: 'none',
                            color: 'var(--ink-2)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon name="minus" size={12} />
                        </button>
                        <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                          {item.qty}
                        </span>
                        <button
                          onClick={() => onChangeQty(item.id, item.qty + 1)}
                          disabled={item.qty >= item.stock}
                          style={{
                            width: 28, height: 28, background: 'none', border: 'none',
                            color: item.qty >= item.stock ? 'var(--ink-4)' : 'var(--ink-2)',
                            cursor: item.qty >= item.stock ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Icon name="plus" size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: 'none', border: '1px solid transparent',
                          color: 'var(--ink-3)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .12s',
                        }}
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
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--line)',
          }}>
            {/* Apartado note */}
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--accent-soft)', border: '1px solid var(--accent)',
              fontSize: 13, color: 'var(--ink-2)', marginBottom: 14,
              lineHeight: 1.5,
            }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>30% para apartar</span> ·{' '}
              <span style={{ fontWeight: 500 }}>
                ${Math.round(subtotal * 0.3).toLocaleString('es-MX')} MXN anticipo
              </span>
            </div>

            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>Subtotal ({count} {count === 1 ? 'artículo' : 'artículos'})</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
                ${subtotal.toLocaleString('es-MX')}
                <small style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 3 }}>MXN</small>
              </span>
            </div>

            {/* Checkout */}
            <button
              onClick={goToCheckout}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 15, height: 48, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Conectando…' : 'Pagar con Shopify →'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 8, fontSize: 14 }}
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  )
}
