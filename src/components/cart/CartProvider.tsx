'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import type { CartItem, Product } from '@/types'

const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false })

const STORAGE_KEY = 'legod-cart'

interface CartCtx {
  items:     CartItem[]
  count:     number
  open:      boolean
  openCart:  () => void
  closeCart: () => void
  addItem:   (p: Product) => void
  removeItem:(id: string) => void
  changeQty: (id: string, qty: number) => void
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

  const addItem = useCallback((p: Product) => {
    setItems(prev => {
      const exists = prev.find(it => it.id === p.id)
      if (exists) {
        return prev.map(it => it.id === p.id ? { ...it, qty: it.qty + 1 } : it)
      }
      return [...prev, { ...p, qty: 1 }]
    })
    setOpen(true)
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(it => it.id !== id))
  }, [])

  const changeQty = useCallback((id: string, qty: number) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, qty } : it))
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
