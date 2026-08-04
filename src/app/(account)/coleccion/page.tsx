'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProductCard from '@/components/product/ProductCard'
import { sampleUser, products } from '@/lib/data'

export default function ColeccionPage() {
  const router = useRouter()
  const collectionIds = sampleUser.collection
  const collection = products.filter(p => collectionIds.includes(p.id))
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const totalValue = collection.reduce((s, p) => s + p.price, 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Mi colección</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {collection.length} piezas · valor estimado ${totalValue.toLocaleString('es-MX')} MXN
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['grid', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: view === v ? 'var(--ink)' : 'var(--paper)',
                color: view === v ? '#fff' : 'var(--ink-2)',
                border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {v === 'grid' ? '⊞' : '☰'}
            </button>
          ))}
        </div>
      </div>

      {collection.length === 0 ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '56px', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--ink-3)' }}>Tu colección está vacía. ¡Empieza a coleccionar!</p>
          <a href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 16 }}>
            Explorar tienda
          </a>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {collection.map(p => (
            <ProductCard
              key={p.id} product={p}
              wished={sampleUser.wishlist.includes(p.id)}
              onView={p2 => router.push(`/tienda/${p2.id}`)}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {collection.map(p => (
            <div key={p.id} style={{
              background: 'var(--paper)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer',
            }} onClick={() => router.push(`/tienda/${p.id}`)}>
              <div style={{
                width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                background: p.fig ? `linear-gradient(135deg, ${p.fig.c1} 0%, ${p.fig.c2} 100%)` : 'var(--cream-2)',
                border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{p.tag}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                ${p.price.toLocaleString('es-MX')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
