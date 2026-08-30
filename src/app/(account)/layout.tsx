'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { nextReward } from '@/lib/loyalty'

type Item = { href: string; icon: string; label: string }

/**
 * Pedidos, apartados, preventas y casillero contestaban la misma pregunta
 * ("¿dónde está mi figura?") desde cuatro entradas distintas, y para acertar
 * había que conocer las categorías internas de la tienda. Ahora "Mis pedidos"
 * las reúne y desde ahí se entra a cada una; siguen existiendo como páginas.
 */
const GRUPOS: { titulo: string; items: Item[] }[] = [
  {
    titulo: 'Mis figuras',
    items: [
      { href: '/pedidos',   icon: 'package', label: 'Mis pedidos' },
      { href: '/coleccion', icon: 'grid',    label: 'Mi colección' },
      { href: '/wishlist',  icon: 'star',    label: 'Wishlist' },
    ],
  },
  {
    titulo: 'Mis beneficios',
    items: [
      { href: '/lealtad', icon: 'sparkle',   label: 'Lealtad' },
      { href: '/saldo',   icon: 'gift-card', label: 'Saldo' },
    ],
  },
  {
    titulo: 'Mi cuenta',
    items: [
      { href: '/perfil',  icon: 'user', label: 'Mi perfil' },
      { href: '/alertas', icon: 'bell', label: 'Alertas' },
    ],
  },
]

/** Páginas que se abren desde "Mis pedidos" y ya no tienen entrada propia. */
const HIJAS_DE_PEDIDOS = ['/casillero', '/apartados', '/mis-preventas']

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  function esActivo(href: string) {
    if (path === href || path.startsWith(href + '/')) return true
    // Estando en el casillero o en un apartado, el menú debe seguir señalando
    // de dónde se entró; si no, nada queda marcado y se pierde el hilo.
    return href === '/pedidos' && HIJAS_DE_PEDIDOS.some(h => path.startsWith(h))
  }
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()

  // Guard: sin sesión no se puede entrar a la sección de cuenta → a login
  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(path)}`)
    }
  }, [loading, user, path, router])

  const displayName = profile?.name || 'Usuario'
  const displayHandle = profile?.handle || 'usuario'
  const isOwner = !!profile?.is_admin
  const grupos = isOwner
    ? [...GRUPOS, { titulo: 'Tienda', items: [{ href: '/admin', icon: 'settings', label: 'Administración' }] }]
    : GRUPOS
  const navItems = grupos.flatMap(g => g.items)
  const pts  = profile?.points_total ?? 0
  // next = 0 significa que ya pasó todos los umbrales — sin él, la barra
  // dividía entre cero y mostraba "12,000 / 0 pts" y puntos negativos.
  const next = profile?.points_next_reward ?? nextReward(pts)
  const maxed = next <= 0
  const pct  = maxed ? 100 : Math.min(100, Math.round((pts / next) * 100))

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--ink-3)', fontSize: 15 }}>Cargando…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="account-layout" style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '240px 1fr',
        gap: 32, padding: '40px 32px 80px',
        alignItems: 'start',
      }}>
        {/* Sidebar */}
        <aside className="account-sidebar-el" style={{ position: 'sticky', top: 100 }}>
          {/* Avatar + name */}
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 16, padding: '20px', marginBottom: 8,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, marginBottom: 12,
            }}>
              {displayName[0]?.toUpperCase()}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{displayName}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>@{displayHandle}</div>

            {/* Points bar */}
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 5 }}>
              {maxed
                ? `${pts.toLocaleString('es-MX')} pts`
                : `${pts.toLocaleString('es-MX')} / ${next.toLocaleString('es-MX')} pts`}
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {maxed
                ? '¡Listo para canjear la recompensa máxima!'
                : `${(next - pts).toLocaleString('es-MX')} pts para tu próxima recompensa`}
            </div>
          </div>

          {/* Nav */}
          <nav style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {grupos.map((g, gi) => (
              <div key={g.titulo}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--ink-3)',
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  padding: gi === 0 ? '14px 16px 6px' : '16px 16px 6px',
                  borderTop: gi === 0 ? 'none' : '1px solid var(--line-soft)',
                }}>
                  {g.titulo}
                </div>
                {g.items.map(item => {
                  const active = esActivo(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px',
                        fontSize: 14, fontWeight: active ? 600 : 400,
                        color: active ? 'var(--accent)' : 'var(--ink-2)',
                        background: active ? 'var(--accent-soft)' : 'transparent',
                        textDecoration: 'none',
                        borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                        transition: 'all .12s',
                      }}
                    >
                      <Icon name={item.icon} size={16} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
            <button
              onClick={signOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '12px 16px', fontSize: 14, fontWeight: 400,
                color: 'var(--danger)', background: 'none',
                border: 'none', borderTop: '1px solid var(--line)',
                cursor: 'pointer', transition: 'background .12s', textAlign: 'left',
              }}
            >
              <Icon name="arrow-left" size={16} />
              Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main>
          {/* Navegación de móvil: la barra lateral se oculta bajo 768px y sin
              esto la cuenta quedaba sin ninguna forma de moverse entre
              secciones. Es una tira que se desliza en horizontal. */}
          <div className="account-nav-mobile" style={{ display: 'none', marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, marginBottom: 12,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{displayName}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {pts.toLocaleString('es-MX')} pts
                  {!maxed && ` · faltan ${(next - pts).toLocaleString('es-MX')}`}
                </div>
              </div>
              <button
                onClick={signOut}
                style={{
                  background: 'none', border: '1px solid var(--line)', borderRadius: 999,
                  padding: '6px 12px', fontSize: 12, color: 'var(--danger)',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                Cerrar sesión
              </button>
            </div>

            <nav style={{
              display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
              scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            }}>
              {navItems.map(item => {
                const active = esActivo(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                      padding: '8px 14px', borderRadius: 999,
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? '#fff' : 'var(--ink-2)',
                      background: active ? 'var(--accent)' : 'var(--paper)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    <Icon name={item.icon} size={14} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}
