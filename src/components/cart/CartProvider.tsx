'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CartItem, Product, ProductVariant } from '@/types'
import { cartKey, defaultVariant } from '@/lib/cart'

const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false })

const STORAGE_KEY = 'legod-cart'

interface CartCtx {
  items:     CartItem[]
  count:     number
  open:      boolean
  openCart:  () => void
  closeCart: () => void
  addItem:   (p: Product, variant?: ProductVariant) => void
  /** Reciben la clave del renglón (`cartKey`), no el id del producto. */
  removeItem:(key: string) => void
  changeQty: (key: string, qty: number) => void
}

const Ctx = createContext<CartCtx | null>(null)

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used within CartProvider')
  return c
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items,   setItems]   = useState<CartItem[]>([])
  const [open,    setOpen]    = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage after first client render to avoid hydration mismatch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const openCart  = useCallback(() => setOpen(true),  [])
  const closeCart = useCallback(() => setOpen(false), [])

  const addItem = useCallback((p: Product, variant?: ProductVariant) => {
    // Un producto con opciones nunca entra sin una elegida: sin variantId el
    // checkout cobraría la primera, que puede no ser la del precio mostrado.
    const v = variant ?? defaultVariant(p)
    const item: CartItem = v
      ? { ...p, price: v.price, stock: v.stock, priceAntes: undefined,
          variantId: v.id, variantTitle: v.title, qty: 1 }
      : { ...p, qty: 1 }
    const key = cartKey(item)
    setItems(prev =>
      prev.some(it => cartKey(it) === key)
        ? prev.map(it => cartKey(it) === key ? { ...it, qty: it.qty + 1 } : it)
        : [...prev, item]
    )
    setOpen(true)
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(it => cartKey(it) !== key))
  }, [])

  const changeQty = useCallback((key: string, qty: number) => {
    setItems(prev => prev.map(it => cartKey(it) === key ? { ...it, qty } : it))
  }, [])

  const count = items.reduce((s, it) => s + it.qty, 0)

  return (
    <Ctx.Provider value={{ items, count, open, openCart, closeCart, addItem, removeItem, changeQty }}>
      {children}
      <CartDrawer
        open={open}
        items={items}
        onClose={closeCart}
        onRemove={removeItem}
        onChangeQty={changeQty}
      />
    </Ctx.Provider>
  )
}
