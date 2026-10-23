'use client'

import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import { useCart } from '@/components/cart/CartProvider'
import { useAuth } from '@/components/auth/AuthProvider'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface Props { alertsCount?: number }

const navItems = [
  { href: '/',           label: 'Inicio' },
  { href: '/tienda',     label: 'Tienda' },
  { href: '/preventas',  label: 'Preventas' },
  { href: '/promos',     label: 'Promos' },
  { href: '/vendenos',   label: 'Véndenos' },
  { href: '/gift-cards', label: 'Gift cards' },
]

export default function Header({ alertsCount = 0 }: Props) {
  const { count, openCart } = useCart()
  const { user }            = useAuth()
  const router               = useRouter()
  const pathname             = usePathname()
  const inputRef             = useRef<HTMLInputElement>(null)
  const [query,      setQuery]      = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted,    setMounted]    = useState(false)
  const [saldo,      setSaldo]      = useState<number | null>(null)

  useEffect(() => setMounted(true), [])

  /* ── Header que se adapta al fondo que tiene debajo ──
     Una página con portada oscura y un header color crema se ve como dos
     sitios pegados. En vez de fijar el tono por ruta, el header pregunta:
     la sección que tengo debajo, ¿se declaró oscura? Lo hace mirando
     `data-header-tono="oscuro"`, que la página pone en su portada.

     Las páginas que no ponen ese atributo —todas las de hoy menos la
     maqueta— se quedan exactamente como estaban. */
  const [oscuro,     setOscuro]     = useState(false)
  const [adaptativo, setAdaptativo] = useState(false)
  useEffect(() => {
    const zona = document.querySelector<HTMLElement>('[data-header-tono="oscuro"]')
    setAdaptativo(!!zona)
    if (!zona) { setOscuro(false); return }
    // Se compara contra la mitad del header: el cambio ocurre cuando la
    // frontera cruza el centro de la barra, no cuando la roza.
    const revisar = () => setOscuro(zona.getBoundingClientRect().bottom > 32)
    revisar()
    window.addEventListener('scroll', revisar, { passive: true })
    window.addEventListener('resize', revisar)
    return () => {
      window.removeEventListener('scroll', revisar)
      window.removeEventListener('resize', revisar)
    }
  }, [pathname])

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

  /* Los dos tonos del header. Sobre fondo oscuro no basta con invertir el
     texto: el cristal tiene que ser oscuro también, si no se ve un parche
     claro encima de la portada. */
  const tono = oscuro
    ? { fondo:'rgba(15,18,64,0.62)', borde:'1px solid rgba(255,255,255,0.10)',
        titulo:'#fff', enlace:'rgba(255,255,255,0.72)' }
    : { fondo:'rgba(245,243,239,0.90)', borde:'1px solid var(--line)',
        titulo:'var(--ink)', enlace:'var(--ink-2)' }

  const icono = iconoTono(oscuro)

  return (
    <header data-tono={oscuro ? 'oscuro' : 'claro'} style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: tono.fondo,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: tono.borde,
      transition: 'background .25s ease, border-color .25s ease',
    }}>
      {/* ── Main row ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 32px', height:64 }} className="header-row">
        {/* Logo — es el nombre de la tienda, así que pesa como un nombre y no
            como un enlace más: va más grande, más apretado y en negra. El
            contraste contra los enlaces (chicos, en versalitas y espaciados)
            es lo que hace que se lea primero. */}
        <Link href="/" style={{ display:'flex', alignItems:'center', gap:11, textDecoration:'none', flexShrink:0 }}>
          <Image src="/assets/logo/legod-logo-violet-128.webp" alt="LEGOD" width={36} height={36} priority style={{ borderRadius:'50%' }} />
          <div className="logo-text">
            <div style={{
              fontWeight: adaptativo ? 900 : 800,
              fontSize:   adaptativo ? 24  : 20,
              lineHeight: adaptativo ? 1   : 1.1,
              letterSpacing: adaptativo ? '-0.035em' : undefined,
              color: tono.titulo,
              transition:'color .25s ease',
            }}>Jango&apos;s Store</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display:'flex', gap: adaptativo ? 2 : 4, marginLeft: adaptativo ? 22 : 16 }}>
          {navItems.map(it => (
            <Link key={it.href} href={it.href} className="nav-link"
              style={adaptativo
                ? { padding:'8px 11px', borderRadius:8, fontSize:12, fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', color:tono.enlace, textDecoration:'none', transition:'color .25s ease' }
                : { padding:'8px 14px', borderRadius:8, fontSize:15, fontWeight:600, color:tono.enlace, textDecoration:'none' }}>
              {it.label}
            </Link>
          ))}
        </nav>

        <div style={{ flex:1 }} />

        {/* Desktop search */}
        <div className="search-wrap nav-desktop" style={{ position:'relative', width:280 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: oscuro ? 'rgba(255,255,255,0.55)' : 'var(--ink-3)', pointerEvents:'none', display:'flex', transition:'color .25s' }}>
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
            style={{
              width:'100%', padding:'9px 52px 9px 36px', borderRadius:999,
              fontSize:14, fontFamily:'inherit', outline:'none',
              transition:'background .25s, border-color .25s, color .25s',
              ...(oscuro
                ? { background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.16)', color:'#fff' }
                : { background:'var(--paper-soft)',      border:'1px solid var(--line)',            color:'var(--ink)' }),
            }}
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

        <Link href={user ? '/perfil' : '/login'} aria-label="Mi cuenta" title="Mi cuenta" style={icono}>
          <Icon name="user" size={17} />
        </Link>

        <button aria-label="Alertas" title="Alertas" style={{ ...icono, border:'none', cursor:'pointer', position:'relative' }}>
          <Icon name="bell" size={17} />
          {mounted && alertsCount > 0 && <Badge>{alertsCount}</Badge>}
        </button>

        <button aria-label="Carrito" title="Carrito" onClick={openCart}
          style={{ ...icono, border:'none', cursor:'pointer', position:'relative' }}>
          <Icon name="cart" size={17} />
          {mounted && count > 0 && <Badge>{count}</Badge>}
        </button>

        {/* Hamburger — visible only on mobile via CSS */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          style={{ ...icono, border:'none', cursor:'pointer', display:'none' }}
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
              style={{ width:'100%', padding:'12px 16px 12px 40px', borderRadius:14, background:'var(--paper)', border:'1px solid var(--line)', fontSize:16, color:'var(--ink)', fontFamily:'inherit', outline:'none', boxSizing:'border-box' }}
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

const iconBase: React.CSSProperties = {
  width:38, height:38, borderRadius:8,
  display:'flex', alignItems:'center', justifyContent:'center',
  textDecoration:'none', flexShrink:0,
  transition:'background .25s, border-color .25s, color .25s',
}

/** Los botones de cuenta, alertas y carrito siguen el tono del header: sobre
 *  la portada oscura serían tres parches claros si se quedaran como están. */
const iconoTono = (oscuro: boolean): React.CSSProperties => oscuro
  ? { ...iconBase, background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.16)', color:'#fff' }
  : { ...iconBase, background:'var(--paper)',           border:'1px solid var(--line)',            color:'var(--ink)' }

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
