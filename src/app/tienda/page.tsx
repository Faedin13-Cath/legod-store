'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductCard from '@/components/product/ProductCard'
import Icon from '@/components/ui/Icon'
import { useCart } from '@/components/cart/CartProvider'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { cats } from '@/lib/data'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import type { Product } from '@/types'

const SORT_OPTIONS = [
  { value: 'nuevo',      label: 'Más nuevos' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc',label: 'Precio: mayor a menor' },
  { value: 'nombre',     label: 'Nombre A-Z' },
]

const TYPE_TABS = [
  { value: 'all',        label: 'Todos' },
  { value: 'minifig',    label: 'Minifiguras' },
  { value: 'set-sealed', label: 'Sets sellados' },
  { value: 'set-used',   label: 'Sets usados' },
]

const STATE_FILTERS = [
  { value: 'new',        label: 'Nuevo' },
  { value: 'perfect',    label: 'Perfecto' },
  { value: 'crack',      label: 'Con crack' },
  { value: 'no-acc',     label: 'Sin accesorios' },
  { value: 'incomplete', label: 'Incompleto' },
]

function TiendaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [search,    setSearch]    = useState(searchParams.get('q')    ?? '')
  const [catFilter, setCatFilter] = useState(searchParams.get('cat')  ?? '')
  const [typeTab,   setTypeTab]   = useState(searchParams.get('tipo') ?? 'all')
  const [stateFilter, setStateFilter] = useState(searchParams.get('estado') ?? '')
  const [sort,      setSort]      = useState('nuevo')
  const [wishlist,    setWishlist]    = useState<Set<string>>(new Set())
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProducts()
      .then(ps => setAllProducts(ps.map(shopifyToProduct)))
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false))
  }, [])

  // Sync wishlist from profile when user logs in
  useEffect(() => {
    if (profile?.wishlist) setWishlist(new Set(profile.wishlist))
    else setWishlist(new Set())
  }, [profile?.wishlist])


  const filtered = useMemo(() => {
    let list = [...allProducts]

    if (typeTab !== 'all')  list = list.filter(p => p.type === typeTab)
    if (catFilter)          list = list.filter(p => p.cat  === catFilter)
    if (stateFilter)        list = list.filter(p => p.state === stateFilter)
    if (search.trim())      list = list.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.tag.toLowerCase().includes(search.toLowerCase())
    )

    if (sort === 'precio-asc')  list.sort((a, b) => a.price - b.price)
    if (sort === 'precio-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'nombre')      list.sort((a, b) => a.name.localeCompare(b.name, 'es'))

    return list
  }, [allProducts, typeTab, catFilter, stateFilter, search, sort])

  const hasFilters = catFilter || stateFilter || search.trim() || typeTab !== 'all'

  function clearAll() {
    setSearch('')
    setCatFilter('')
    setTypeTab('all')
    setStateFilter('')
  }

  async function toggleWish(p: Product) {
    const next = new Set(wishlist)
    if (next.has(p.id)) { next.delete(p.id) } else { next.add(p.id) }
    setWishlist(next)
    if (user) {
      await supabase.from('profiles').update({ wishlist: Array.from(next) }).eq('id', user.id)
    }
  }

  function addToCart(p: Product) {
    addItem(p)
  }

  function viewProduct(p: Product) {
    router.push(`/tienda/${p.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Page header */}
      <div className="sec" style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '32px 32px 0',
        display: 'flex', alignItems: 'baseline', gap: 12,
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Tienda</h1>
        <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>
          {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* Filter bar */}
      <div style={{
        position: 'sticky', top: 56, zIndex: 50,
        background: 'rgba(245,243,239,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 2, paddingTop: 12, paddingBottom: 8 }}>
            {TYPE_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTypeTab(t.value)}
                style={{
                  padding: '6px 16px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  background: typeTab === t.value ? 'var(--ink)' : 'transparent',
                  color: typeTab === t.value ? '#fff' : 'var(--ink-2)',
                  border: typeTab === t.value ? 'none' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all .12s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Second row: cats + search + sort */}
          <div className="filter-selects" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, flexWrap: 'wrap' }}>
            {/* Category pills */}
            <div className="filter-cats" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
              {cats.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(catFilter === c.id ? '' : c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 999,
                    fontSize: 12, fontWeight: 500,
                    background: catFilter === c.id ? 'var(--accent)' : 'var(--paper)',
                    color: catFilter === c.id ? '#fff' : 'var(--ink-2)',
                    border: `1px solid ${catFilter === c.id ? 'var(--accent)' : 'var(--line)'}`,
                    cursor: 'pointer',
                    transition: 'all .12s',
                  }}
                >
                  <span style={{ fontSize: 11 }}>{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* State filter */}
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 400,
                background: 'var(--paper)', color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
              }}
            >
              <option value="">Estado: todos</option>
              {STATE_FILTERS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 8,
                fontSize: 13, fontWeight: 400,
                background: 'var(--paper)', color: 'var(--ink-2)',
                border: '1px solid var(--line)',
                cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Search */}
            <div className="filter-search" style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}>
                <Icon name="search" size={14} />
              </span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar…"
                style={{
                  paddingLeft: 32, paddingRight: search ? 32 : 12,
                  paddingTop: 7, paddingBottom: 7,
                  width: 180, borderRadius: 8, fontSize: 13,
                  background: 'var(--paper)', color: 'var(--ink)',
                  border: '1px solid var(--line)',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Icon name="close" size={13} />
                </button>
              )}
            </div>

            {/* Clear all */}
            {hasFilters && (
              <button
                onClick={clearAll}
                style={{
                  padding: '7px 12px', borderRadius: 8,
                  fontSize: 12, fontWeight: 500,
                  background: 'none', color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  cursor: 'pointer',
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="sec" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: 'var(--ink-3)', fontSize: 15 }}>
            Cargando productos…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onClear={clearAll} />
        ) : (
          <div className="tienda-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 16,
          }}>
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                wished={wishlist.has(p.id)}
                onView={viewProduct}
                onAdd={addToCart}
                onWish={user ? toggleWish : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '80px 32px', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        color: 'var(--accent)',
      }}>
        <Icon name="search" size={28} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)', margin: '0 0 8px' }}>
        Sin resultados
      </h2>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: '0 0 24px', maxWidth: 320, lineHeight: 1.6 }}>
        Ningún producto coincide con tu búsqueda. Intenta con otros filtros.
      </p>
      <button
        onClick={onClear}
        style={{
          padding: '10px 24px', borderRadius: 10,
          background: 'var(--ink)', color: '#fff',
          border: 'none', fontSize: 14, fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Ver todos los productos
      </button>
    </div>
  )
}

export default function TiendaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 64, textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>}>
      <TiendaContent />
    </Suspense>
  )
}
