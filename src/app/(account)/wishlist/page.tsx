'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductCard from '@/components/product/ProductCard'
import Icon from '@/components/ui/Icon'
import { sampleUser, products } from '@/lib/data'

export default function WishlistPage() {
  const router = useRouter()
  const [wishlist, setWishlist] = useState<string[]>(sampleUser.wishlist)

  const wished = products.filter(p => wishlist.includes(p.id))

  function removeFromWishlist(id: string) {
    setWishlist(prev => prev.filter(x => x !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Wishlist</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {wished.length} {wished.length === 1 ? 'artículo' : 'artículos'} guardados
          </p>
        </div>
      </div>

      {wished.length === 0 ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '56px', textAlign: 'center',
        }}>
          <div style={{ color: 'var(--gold)', marginBottom: 12 }}><Icon name="star" size={32} /></div>
          <p style={{ color: 'var(--ink-3)', margin: '0 0 20px' }}>
            Tu wishlist está vacía. Guarda tus figuras favoritas y te avisamos si bajan de precio o vuelven a stock.
          </p>
          <a href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Explorar tienda
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {wished.map(p => (
            <ProductCard
              key={p.id} product={p}
              wished={true}
              onView={p2 => router.push(`/tienda/${p2.id}`)}
              onWish={p2 => removeFromWishlist(p2.id)}
            />
          ))}
        </div>
      )}

      {/* Alert setup CTA */}
      {wished.some(p => p.stock === 0) && (
        <div style={{
          marginTop: 24, padding: '18px 24px',
          background: 'var(--accent-soft)', border: '1px solid var(--accent)',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Icon name="bell" size={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>
              Algunas figuras de tu wishlist están agotadas
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
              Activa alertas en{' '}
              <a href="/alertas" style={{ color: 'var(--accent)', fontWeight: 500 }}>Alertas</a>{' '}
              para que te avisemos cuando vuelvan a stock.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
