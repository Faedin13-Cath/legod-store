'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import MinifigImage from '@/components/product/MinifigImage'
import { useAuth } from '@/components/auth/AuthProvider'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import { PREVENTAS_PUBLIC } from '@/lib/preventa'
import type { Product } from '@/types'

type Modalidad = 'completo' | 'split'

function PreventaCard({ product }: { product: Product }) {
  const { user } = useAuth()
  const pv = product.preventa!
  const [choice,  setChoice]  = useState<Modalidad>('completo')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const ahorro = pv.split - pv.full

  async function reservar() {
    if (!user) { window.location.href = `/login?next=/preventas`; return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/checkout/preventa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: product.id, modalidad: choice, qty: 1,
          userId: user.id, userEmail: user.email,
        }),
      })
      const data = await res.json()
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return }
      setError(data.error ?? 'No se pudo generar el pago.')
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const options: { id: Modalidad; label: string; amount: number; sub: string }[] = [
    {
      id: 'completo', label: 'Pago completo', amount: pv.full,
      sub: `Un solo pago. Ahorras $${ahorro.toLocaleString('es-MX')} MXN.`,
    },
    {
      id: 'split', label: 'Anticipo y resto al llegar', amount: pv.deposit,
      sub: `$${pv.pending.toLocaleString('es-MX')} MXN al llegar · total $${pv.split.toLocaleString('es-MX')} MXN`,
    },
  ]

  return (
    <article style={{
      background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: 20, overflow: 'hidden',
      display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0,
    }} className="preventa-card">
      <div style={{
        background: '#fff', borderRight: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 260, position: 'relative',
      }}>
        <MinifigImage product={product} />
        <span style={{
          position: 'absolute', top: 14, left: 14,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '4px 10px', borderRadius: 999,
          background: 'var(--accent)', color: '#fff',
        }}>
          Preventa
        </span>
      </div>

      <div style={{ padding: '24px 26px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.2 }}>
          {product.name}
        </h2>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', margin: '0 0 18px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {product.tag}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {options.map(o => {
            const on = choice === o.id
            return (
              <button
                key={o.id}
                onClick={() => setChoice(o.id)}
                style={{
                  textAlign: 'left', width: '100%', cursor: 'pointer',
                  padding: '14px 16px', borderRadius: 12,
                  background: on ? 'var(--accent-soft)' : 'var(--cream)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                  transition: 'all .12s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                  background: on ? 'var(--accent)' : 'var(--paper)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <Icon name="check" size={9} color="#fff" />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: on ? 'var(--accent)' : 'var(--ink)' }}>
                    {o.label}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {o.sub}
                  </span>
                </span>
                <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', flexShrink: 0 }}>
                  ${o.amount.toLocaleString('es-MX')}
                </span>
              </button>
            )
          })}
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
            padding: '9px 13px', marginBottom: 12, fontSize: 13, color: '#DC2626',
          }}>
            {error}
          </div>
        )}

        <button onClick={reservar} disabled={loading} className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 15 }}>
          {loading
            ? 'Generando pago…'
            : `Reservar — pagar $${(choice === 'completo' ? pv.full : pv.deposit).toLocaleString('es-MX')} MXN`}
        </button>

        <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '12px 0 0', lineHeight: 1.6 }}>
          Los códigos de descuento no aplican en preventa. Te avisamos por WhatsApp
          en cuanto llegue tu figura.
        </p>
      </div>
    </article>
  )
}

export default function PreventasPage() {
  const { profile, loading: authLoading } = useAuth()
  const [items,   setItems]   = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const allowed = PREVENTAS_PUBLIC || !!profile?.is_admin

  useEffect(() => {
    if (!allowed) return
    getProducts()
      .then(ps => setItems(ps.map(shopifyToProduct).filter(p => p.preventa)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [allowed])

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
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 32px 90px' }}>
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
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 560 }}>
          Aparta figuras antes de que lleguen. Pagas menos si liquidas de una vez,
          o reservas con un anticipo y cubres el resto cuando la tengamos en mano.
        </p>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
            Cargando preventas…
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
            {items.map(p => <PreventaCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
