'use client'

import Link from 'next/link'
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
  /** Enlace real a la ficha en el nombre. La tarjeta ya navega con clic, pero
   *  Google solo sigue `<a href>`: sin esto no llega de una categoría a sus
   *  productos. */
  href?: string
  wished?: boolean
  onView?: (p: Product) => void
  onAdd?: (p: Product) => void
  onWish?: (p: Product) => void
}

export default function ProductCard({ product, href, wished, onView, onAdd, onWish }: Props) {
  const out = product.stock === 0
  // Exclusivas de convención: se distinguen con el borde en oro para que se
  // note en la reja que no son una figura de catálogo más.
  const nycc = product.tags.includes('nycc')
  // Con opciones de distinto precio no hay "un" precio: se anuncia el más
  // bajo, y el + lleva a la ficha para elegir en vez de meter una al azar.
  const conOpciones = !!product.variants
  const variosPrecios = conOpciones && new Set(product.variants!.map(v => v.price)).size > 1

  const visibleTags = product.tags.filter(t => tagPill[t])
  if (out && !visibleTags.includes('agotado')) visibleTags.push('agotado')

  return (
    <article
      className={'prod-card cursor-pointer' + (nycc ? ' nycc-oro' : '')}
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
          {nycc && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 999,
              background: 'var(--gold)', color: '#3A2A00',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
            }}>
              NYCC
            </span>
          )}
          {product.state === 'crack' && (
            <span className="pill detalle">Con detalle</span>
          )}
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
            title={wished ? 'Quitar de wishlist' : 'Agregar a wishlist'}
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
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
          {href ? (
            // El enlace navega solo (y abre en otra pestaña con Ctrl+clic);
            // stopPropagation evita que la tarjeta navegue una segunda vez.
            <Link href={href} onClick={e => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none' }}>
              {product.name}
            </Link>
          ) : product.name}
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>{product.tag}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {variosPrecios && (
              <small style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)', letterSpacing: 0, marginRight: 4 }}>Desde</small>
            )}
            {!conOpciones && product.priceAntes && (
              <span style={{
                fontSize: 13, fontWeight: 500, color: 'var(--ink-3)',
                textDecoration: 'line-through', marginRight: 6, letterSpacing: 0,
              }}>
                ${product.priceAntes.toLocaleString('es-MX')}
              </span>
            )}
            ${product.price.toLocaleString('es-MX')} <small style={{ fontSize: 11, fontWeight: 400, color: 'var(--ink-3)', letterSpacing: 0 }}>MXN</small>
          </div>
          <button
            className="prod-add"
            disabled={out}
            onClick={e => {
              e.stopPropagation()
              if (conOpciones) onView?.(product)
              else onAdd?.(product)
            }}
            aria-label={conOpciones ? 'Elegir opción' : 'Añadir al carrito'}
            title={out ? 'Agotado' : conOpciones ? 'Elegir opción' : 'Añadir al carrito'}
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
