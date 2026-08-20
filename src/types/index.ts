export type ProductCat = 'starwars' | 'marvel' | 'dc' | 'harry' | 'stranger' | 'castle' | 'sports' | 'custom' | 'pixar' | 'series'
export type ProductType = 'minifig' | 'set-sealed' | 'set-used'
export type ProductState = 'perfect' | 'new' | 'crack' | 'no-acc' | 'incomplete'
export type ProductRarity = 'comun' | 'rara' | 'limitada' | 'unica'
export type ProductTag = 'nuevo' | 'restock' | 'oferta' | 'edicion-limitada' | 'sellado' | 'usado' | 'popular' | 'agotado' | 'limitada' | 'custom' | 'promo'

export interface Product {
  id: string
  sku: string
  name: string
  cat: ProductCat
  type: ProductType
  tag: string
  price: number
  stock: number
  state: ProductState
  rarity: ProductRarity
  photo?: string
  fig?: { c1: string; c2: string }
  tags: ProductTag[]
  desc: string
  blId?: string
}

export interface CartItem extends Product {
  qty: number
}

export interface Apartado {
  productId: string
  total: number
  paid: number
  dueAt: number
  notify: { whatsapp: boolean; email: boolean }
}

export interface Order {
  id: string
  date: string
  total: number
  status: 'pagado' | 'apartado' | 'enviado' | 'entregado'
  productIds: string[]
  tracking?: string
}

export interface Alert {
  type: 'restock' | 'pricedrop' | 'wishlist'
  productId: string
  message: string
  at: string
  read: boolean
}

export interface User {
  id: string
  handle: string
  name: string
  email: string
  avatar: string | null
  joined: string
  pointsTotal: number
  pointsNextReward: number
  profilePublic: 'public' | 'link-only' | 'private'
  channels: { whatsapp?: string; email?: string }
  collection: string[]
  wishlist: string[]
  apartados: Apartado[]
  orders: Order[]
  alerts: Alert[]
}

export interface Category {
  id: string
  label: string
  emoji: string
}
