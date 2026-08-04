'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import { sampleUser } from '@/lib/data'

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
  const user = sampleUser

  const pct = Math.round((user.pointsTotal / user.pointsNextReward) * 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '240px 1fr',
        gap: 32, padding: '40px 32px 80px',
        alignItems: 'start',
      }}>
        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 100 }}>
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
              {user.name[0]}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{user.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 14 }}>@{user.handle}</div>

            {/* Points bar */}
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 5 }}>
              {user.pointsTotal.toLocaleString('es-MX')} / {user.pointsNextReward.toLocaleString('es-MX')} pts
            </div>
            <div style={{ height: 4, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {user.pointsNextReward - user.pointsTotal} pts para tu próxima recompensa
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
            <Link
              href="/"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', fontSize: 14, fontWeight: 400,
                color: 'var(--danger)', textDecoration: 'none',
                borderTop: '1px solid var(--line)',
                transition: 'background .12s',
              }}
            >
              <Icon name="arrow-left" size={16} />
              Cerrar sesión
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
