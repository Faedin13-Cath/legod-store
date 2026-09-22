'use client'

import { useRouter } from 'next/navigation'
import ProductCard from './ProductCard'
import { useCart } from '@/components/cart/CartProvider'
import type { Product } from '@/types'

/** Reja de productos para páginas armadas en el servidor (categorías). Los
 *  productos llegan ya cargados, así que el HTML trae nombres, precios y
 *  enlaces sin esperar a JavaScript. */
export default function GridProductos({ productos }: { productos: Product[] }) {
  const router = useRouter()
  const { addItem } = useCart()

  return (
    <div className="tienda-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
      {productos.map(p => (
        <ProductCard
          key={p.id}
          product={p}
          href={`/tienda/${p.id}`}
          onView={() => router.push(`/tienda/${p.id}`)}
          onAdd={addItem}
        />
      ))}
    </div>
  )
}
