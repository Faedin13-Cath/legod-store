'use client'

import Icon from '@/components/ui/Icon'
import MinifigImage from './MinifigImage'
import type { Product } from '@/types'

const tagPill: Record<string, string> = {
  nuevo:          'pill gold',
  restock:        'pill violet',
  oferta:         'pill danger',
  'edicion-limitada': 'pill warn',
  sellado:        'pill',
  usado:          'pill',
  agotado:        'pill danger',
}

interface Props {
  product: Product
  wished?: boolean
  onView?: (p: Product) => void
  onAdd?: (p: Product) => void
  onWish?: (p: Product) => void
}

export default function ProductCard({ product, wished, onView, onAdd, onWish }: Props) {
  const out = product.stock === 0

  const visibleTags = product.tags.filter(t => tagPill[t])
  if (out && !visibleTags.includes('agotado')) visibleTags.push('agotado')

  return (
    <article
      className="prod-card cursor-pointer"
      onClick={() => onView?.(product)}
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 24,
        overflow: 'hidden',
        transition: 'border-color .15s, box-shadow .15s',
      }}
    >
      {/* Image */}
      <div
        className="prod-img"
        style={{
          position: 'relative',
          paddingTop: '133%',
          background: '#fff',
          borderBottom: '1px solid var(--line-soft)',
          overflow: 'hidden',
        }}
      >
        <div className="prod-img-wrap" style={{ position: 'absolute', inset: 0 }}>
          <MinifigImage product={product} />
        </div>

        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {visibleTags.slice(0, 2).map(t => (
            <span key={t} className={tagPill[t] ?? 'pill'}>{
              t === 'nuevo' ? 'Nuevo' :
              t === 'restock' ? 'Restock' :
              t === 'oferta' ? 'Oferta' :
              t === 'edicion-limitada' ? 'Limitada' :
              t === 'sellado' ? 'Sellado' :
              t === 'usado' ? 'Usado' :
              t === 'agotado' ? 'Agotado' : t
            }</span>
          ))}
        </div>

        {/* Wishlist star — solo visible cuando el usuario está logueado (onWish definido) */}
        {onWish && (
          <button
            className={'prod-wishlist ' + (wished ? 'active' : '')}
            onClick={e => { e.stopPropagation(); onWish(product) }}
            aria-label="Wishlist"
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: wished ? 'var(--gold)' : 'var(--ink-2)',
              cursor: 'pointer',
            }}
          >
            <Icon name={wished ? 'star-fill' : 'star'} size={14} />
          </button>
        )}

      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2, lineHeight: 1.3, letterSpacing: '-0.01em' }}>{product.name}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{product.tag}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            ${product.price.toLocaleString('es-MX')} <small style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', letterSpacing: 0 }}>MXN</small>
          </div>
          <button
            className="prod-add"
            disabled={out}
            onClick={e => { e.stopPropagation(); onAdd?.(product) }}
            aria-label="Añadir al carrito"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: out ? 'var(--ink-4)' : 'var(--ink)',
              color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: out ? 'not-allowed' : 'pointer',
              transition: 'background .15s',
            }}
          >
            <Icon name="plus" size={15} />
          </button>
        </div>

      </div>
    </article>
  )
}
