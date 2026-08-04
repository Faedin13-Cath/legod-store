'use client'
// v2 — shopify
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import MinifigImage from '@/components/product/MinifigImage'
import ProductCard from '@/components/product/ProductCard'
import { useCart } from '@/components/cart/CartProvider'
import { getProducts, getProductByHandle, shopifyToProduct } from '@/lib/shopify'
import type { Product } from '@/types'

const STATE_LABEL: Record<string, string> = {
  new:        'Nuevo · sin uso',
  perfect:    'Perfecto · sin marcas',
  crack:      'Con crack · ver fotos',
  'no-acc':   'Sin accesorios',
  incomplete: 'Incompleto',
}

const RARITY_LABEL: Record<string, { label: string; color: string }> = {
  comun:    { label: 'Común',    color: 'var(--ink-3)' },
  rara:     { label: 'Rara',     color: 'var(--accent)' },
  limitada: { label: 'Limitada', color: 'var(--gold)' },
  unica:    { label: 'Única',    color: '#E5632A' },
}

export default function ProductPage({ params }: { params: { handle: string } }) {
  const { handle } = params
  const router = useRouter()
  const { addItem } = useCart()

  const [product,  setProduct]  = useState<Product | null | undefined>(undefined)
  const [related,  setRelated]  = useState<Product[]>([])
  const [qty,      setQty]      = useState(1)
  const [wished,   setWished]   = useState(false)
  const [added,    setAdded]    = useState(false)
  const [apartado, setApartado] = useState(false)

  useEffect(() => {
    getProductByHandle(handle)
      .then(p => {
        if (!p) { setProduct(null); return }
        const converted = shopifyToProduct(p)
        setProduct(converted)
        return getProducts()
      })
      .then(all => {
        if (!all) return
        setRelated(
          all.map(shopifyToProduct)
             .filter(p => p.id !== handle)
             .slice(0, 5)
        )
      })
      .catch(() => setProduct(null))
  }, [handle])

  if (product === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0', color: 'var(--ink-3)', fontSize: 15 }}>
        Cargando…
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center', padding: '0 32px' }}>
        <h1 style={{ color: 'var(--ink)', marginBottom: 12 }}>Producto no encontrado</h1>
        <p style={{ color: 'var(--ink-3)', marginBottom: 24 }}>Puede que ya no esté disponible.</p>
        <Link href="/tienda" style={{ color: 'var(--accent)', fontWeight: 500 }}>← Volver a la tienda</Link>
      </div>
    )
  }

  const out = product.stock === 0
  const rarity = RARITY_LABEL[product.rarity]

  function handleAdd() {
    if (product) {
      for (let i = 0; i < qty; i++) addItem(product)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleApartado() {
    setApartado(true)
    setTimeout(() => setApartado(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Breadcrumb */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 0' }}>
        <nav style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
          <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Inicio</Link>
          <span>/</span>
          <Link href="/tienda" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Tienda</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>{product.name}</span>
        </nav>
      </div>

      {/* PDP layout */}
      <div className="pdp-grid" style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 64, padding: '32px 32px 80px', alignItems: 'start',
      }}>
        {/* Left: image */}
        <div>
          <div style={{
            borderRadius: 24, overflow: 'hidden',
            background: 'radial-gradient(circle at 30% 20%, var(--accent-soft) 0%, transparent 60%), var(--paper-soft)',
            border: '1px solid var(--line)',
            aspectRatio: '3/4',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MinifigImage product={product} />

            {/* Tags overlay */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {product.tags.slice(0, 3).map(t => (
                <span key={t} className={
                  t === 'nuevo' ? 'pill gold' :
                  t === 'restock' ? 'pill violet' :
                  t === 'agotado' ? 'pill danger' :
                  t === 'edicion-limitada' ? 'pill warn' : 'pill'
                }>
                  {t === 'nuevo' ? 'Nuevo' : t === 'restock' ? 'Restock' : t === 'agotado' ? 'Agotado' : t === 'edicion-limitada' ? 'Limitada' : t}
                </span>
              ))}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => setWished(!wished)}
              aria-label="Wishlist"
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: wished ? 'var(--gold)' : 'var(--ink-2)',
                cursor: 'pointer',
              }}
            >
              <Icon name={wished ? 'star-fill' : 'star'} size={18} />
            </button>
          </div>

          {/* Condition note */}
          {product.state === 'crack' && (
            <div style={{
              marginTop: 12, padding: '12px 16px', borderRadius: 10,
              background: '#FFF8E1', border: '1px solid #F5C84A',
              fontSize: 13, color: '#7A5B00', lineHeight: 1.5,
            }}>
              <strong>⚠ Atención:</strong> Esta pieza tiene un pequeño crack. Revisa las fotos antes de comprar. El precio ya refleja el estado.
            </div>
          )}
        </div>

        {/* Right: info */}
        <div>
          {/* SKU + rarity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {product.sku}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: rarity.color, padding: '2px 8px', borderRadius: 999,
              border: `1px solid ${rarity.color}`, opacity: 0.9,
            }}>
              {rarity.label}
            </span>
          </div>

          {/* Name */}
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.15 }}>
            {product.name}
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)', margin: '0 0 20px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {product.tag}
          </p>

          {/* Price */}
          <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--ink)', margin: '0 0 20px' }}>
            ${product.price.toLocaleString('es-MX')}
            <small style={{ fontSize: 16, fontWeight: 400, color: 'var(--ink-3)', marginLeft: 6 }}>MXN</small>
          </div>

          {/* State + stock */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)' }}>
              <Icon name="check" size={14} />
              {STATE_LABEL[product.state] ?? product.state}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: out ? 'var(--danger)' : 'var(--success)' }}>
              <Icon name={out ? 'close' : 'check'} size={14} />
              {out ? 'Agotado' : `${product.stock} en stock`}
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)', margin: '0 0 28px', maxWidth: 440 }}>
            {product.desc}
          </p>

          {/* Quantity + actions */}
          {!out && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {/* Qty selector */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden',
                  background: 'var(--paper)',
                }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    style={{
                      width: 38, height: 44, background: 'none', border: 'none',
                      cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                      color: qty <= 1 ? 'var(--ink-4)' : 'var(--ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><Icon name="minus" size={14} /></button>
                  <span style={{ width: 36, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    style={{
                      width: 38, height: 44, background: 'none', border: 'none',
                      cursor: qty >= product.stock ? 'not-allowed' : 'pointer',
                      color: qty >= product.stock ? 'var(--ink-4)' : 'var(--ink)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><Icon name="plus" size={14} /></button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={handleAdd}
                  className="btn btn-primary"
                  style={{ flex: 1, height: 44, fontSize: 15 }}
                >
                  {added ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="check" size={15} /> Añadido</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cart" size={15} /> Añadir al carrito</span>
                  )}
                </button>
              </div>

              {/* Apartado */}
              <button
                onClick={handleApartado}
                className="btn btn-secondary"
                style={{ width: '100%', height: 44, fontSize: 14, marginBottom: 20 }}
              >
                {apartado ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Icon name="check" size={15} /> ¡Apartado!</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Icon name="clock" size={15} />
                    Apartar con 30% — ${Math.round(product.price * 0.3).toLocaleString('es-MX')} MXN
                  </span>
                )}
              </button>
            </>
          )}

          {out && (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', height: 44, fontSize: 14, marginBottom: 20 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon name="bell" size={15} />
                Notificarme cuando llegue
              </span>
            </button>
          )}

          {/* Benefits */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            padding: '16px', borderRadius: 12,
            background: 'var(--paper)', border: '1px solid var(--line)',
          }}>
            {[
              { icon: 'truck',   text: 'Envío a todo México' },
              { icon: 'shield',  text: 'Pago seguro MercadoPago' },
              { icon: 'clock',   text: 'Apartado 7 días' },
              { icon: 'sparkle', text: '10% off en tu primera compra' },
            ].map(b => (
              <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)' }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}><Icon name={b.icon as never} size={14} /></span>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px 80px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 20 }}>
            Más de {product.cat === 'starwars' ? 'Star Wars' : product.cat === 'marvel' ? 'Marvel' : product.cat === 'dc' ? 'DC' : product.cat === 'harry' ? 'Harry Potter' : product.cat === 'stranger' ? 'Stranger Things' : product.cat === 'sports' ? 'Deportes' : product.cat}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {related.map(p => (
              <ProductCard
                key={p.id} product={p}
                onView={p2 => router.push(`/tienda/${p2.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
