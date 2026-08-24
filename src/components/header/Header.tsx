'use client'

import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import { useCart } from '@/components/cart/CartProvider'
import { useAuth } from '@/components/auth/AuthProvider'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props { alertsCount?: number }

const navItems = [
  { href: '/',           label: 'Inicio' },
  { href: '/tienda',     label: 'Tienda' },
  { href: '/promos',     label: 'Promos' },
  { href: '/vendenos',   label: 'Véndenos' },
  { href: '/gift-cards', label: 'Gift cards' },
]

export default function Header({ alertsCount = 0 }: Props) {
  const { count, openCart } = useCart()
  const { user }            = useAuth()
  const router               = useRouter()
  const inputRef             = useRef<HTMLInputElement>(null)
  const [query,      setQuery]      = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted,    setMounted]    = useState(false)
  const [saldo,      setSaldo]      = useState<number | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!user) { setSaldo(null); return }
    fetch('/api/balance')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSaldo(d.balance) })
  }, [user])

  /* ⌘K / Ctrl+K focuses search */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function submitSearch(q: string) {
    if (!q.trim()) return
    router.push(`/tienda?q=${encodeURIComponent(q.trim())}`)
    setQuery('')
    setMobileOpen(false)
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(245,243,239,0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--line)',
    }}>
      {/* ── Main row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 32px', height:64 }} className="header-row">
        {/* Logo */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
          <Image src="/assets/logo/legod-logo-violet.png" alt="LEGOD" width={34} height={34} style={{ borderRadius:'50%' }} />
          <div className="logo-text">
            <div style={{ fontWeight:700, fontSize:16, color:'var(--ink)', lineHeight:1.1 }}>Jango&apos;s Store</div>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>Minifiguras LEGO</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display:'flex', gap:2, marginLeft:12 }}>
          {navItems.map(it => (
            <Link key={it.href} href={it.href} className="nav-link"
              style={{ padding:'6px 12px', borderRadius:8, fontSize:14, fontWeight:500, color:'var(--ink-2)', textDecoration:'none' }}>
              {it.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex:1 }} />

        {/* Desktop search */}
        <div className="search-wrap nav-desktop" style={{ position:'relative', width:280 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3)', pointerEvents:'none', display:'flex' }}>
            <Icon name="search" size={14} />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitSearch(query)}
            type="search"
            placeholder="Buscar figuras, sets..."
            className="search-input"
            style={{ width:'100%', padding:'8px 52px 8px 34px', borderRadius:999, background:'var(--paper-soft)', border:'1px solid var(--line)', fontSize:13, color:'var(--ink)', fontFamily:'inherit', outline:'none' }}
          />
          <span className="search-kbd">⌘K</span>
        </div>

        {/* Icon row */}
        {mounted && user && saldo !== null && saldo > 0 && (
          <Link href="/saldo" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0 11px', height: 38, borderRadius: 8,
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
            color: 'var(--accent)', flexShrink: 0,
            transition: 'background .12s',
          }} className="nav-desktop" aria-label="Mi saldo" title="Mi saldo">
            <Icon name="gift-card" size={13} />
            ${saldo.toLocaleString('es-MX')}
          </Link>
        )}

        <Link href={user ? '/perfil' : '/login'} aria-label="Mi cuenta" title="Mi cuenta" style={icon}>
          <Icon name="user" size={17} />
        </Link>

        <button aria-label="Alertas" title="Alertas" style={{ ...icon, border:'none', cursor:'pointer', position:'relative' }}>
          <Icon name="bell" size={17} />
          {mounted && alertsCount > 0 && <Badge>{alertsCount}</Badge>}
        </button>

        <button aria-label="Carrito" title="Carrito" onClick={openCart}
          style={{ ...icon, border:'none', cursor:'pointer', position:'relative' }}>
          <Icon name="cart" size={17} />
          {mounted && count > 0 && <Badge>{count}</Badge>}
        </button>

        {/* Hamburger — visible only on mobile via CSS */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          style={{ ...icon, border:'none', cursor:'pointer', display:'none' }}
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} size={19} />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div style={{ background:'var(--cream)', borderTop:'1px solid var(--line)', padding:'16px 20px 24px' }}>
          {/* Mobile search */}
          <div style={{ position:'relative', marginBottom:16 }}>
            <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--ink-3)', pointerEvents:'none' }}>
              <Icon name="search" size={15} />
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitSearch(query)}
              type="search"
              placeholder="Buscar minifiguras, sets, temas..."
              className="search-input"
              autoFocus
              style={{ width:'100%', padding:'12px 16px 12px 40px', borderRadius:14, background:'var(--paper)', border:'1px solid var(--line)', fontSize:15, color:'var(--ink)', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
            />
          </div>

          {/* Nav links */}
          <nav style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {navItems.map(it => (
              <Link
                key={it.href} href={it.href}
                onClick={() => setMobileOpen(false)}
                style={{ display:'block', padding:'13px 12px', borderRadius:10, fontSize:17, fontWeight:500, color:'var(--ink-2)', textDecoration:'none', borderBottom:'1px solid var(--line-soft)' }}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

const icon: React.CSSProperties = {
  width:38, height:38, borderRadius:8,
  background:'var(--paper)', border:'1px solid var(--line)',
  color:'var(--ink)',
  display:'flex', alignItems:'center', justifyContent:'center',
  textDecoration:'none', flexShrink:0,
  transition:'background .12s, border-color .12s',
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      position:'absolute', top:-4, right:-4,
      background:'var(--accent)', color:'#fff',
      fontSize:10, fontWeight:700, lineHeight:1,
      padding:'2px 5px', borderRadius:999, minWidth:16, textAlign:'center',
    }}>
      {children}
    </span>
  )
}
