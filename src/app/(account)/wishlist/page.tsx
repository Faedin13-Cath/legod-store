'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import ProductCard from '@/components/product/ProductCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import type { Product } from '@/types'

export default function WishlistPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handles = profile?.wishlist ?? []
    if (handles.length === 0) { setLoading(false); return }

    getProducts()
      .then(all => {
        const wished = all
          .filter(p => handles.includes(p.handle))
          .map(shopifyToProduct)
        setItems(wished)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [profile?.wishlist])

  async function removeFromWishlist(p: Product) {
    const next = (profile?.wishlist ?? []).filter(h => h !== p.id)
    setItems(prev => prev.filter(x => x.id !== p.id))
    if (user) {
      await supabase.from('profiles').update({ wishlist: next }).eq('id', user.id)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Wishlist</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          {loading ? '…' : `${items.length} ${items.length === 1 ? 'artículo' : 'artículos'} guardados`}
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '56px', textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>
      ) : items.length === 0 ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '56px', textAlign: 'center',
        }}>
          <div style={{ color: 'var(--gold)', marginBottom: 12 }}><Icon name="star" size={32} /></div>
          <p style={{ color: 'var(--ink-3)', margin: '0 0 20px' }}>
            Tu wishlist está vacía. Dale estrella a las figuras que te gusten desde la tienda.
          </p>
          <a href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Explorar tienda
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {items.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              wished={true}
              onView={p2 => router.push(`/tienda/${p2.id}`)}
              onWish={removeFromWishlist}
            />
          ))}
        </div>
      )}
    </div>
  )
}
