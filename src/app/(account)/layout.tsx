'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

const NAV = [
  { href: '/perfil',    icon: 'user',    label: 'Mi perfil' },
  { href: '/pedidos',   icon: 'package', label: 'Mis pedidos' },
  { href: '/coleccion', icon: 'grid',    label: 'Mi colección' },
  { href: '/wishlist',  icon: 'star',    label: 'Wishlist' },
  { href: '/apartados', icon: 'clock',   label: 'Apartados' },
  { href: '/alertas',   icon: 'bell',    label: 'Alertas' },
  { href: '/lealtad',   icon: 'sparkle', label: 'Lealtad' },
]

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { profile, loading, signOut } = useAuth()

  const displayName = profile?.name || 'Usuario'
  const displayHandle = profile?.handle || 'usuario'
  const pts  = profile?.points_total ?? 0
  const next = profile?.points_next_reward ?? 1500
  const pct  = Math.min(100, Math.round((pts / next) * 100))

  if (loading) {
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
              {pts.toLocaleString('es-MX')} / {next.toLocaleString('es-MX')} pts
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {next - pts} pts para tu próxima recompensa
            </div>
          </div>

          {/* Nav */}
          <nav style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {NAV.map(item => {
              const active = path === item.href || path.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px',
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
        <main>{children}</main>
      </div>
    </div>
  )
}
