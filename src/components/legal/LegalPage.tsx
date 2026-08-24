import Link from 'next/link'

export default function LegalPage({ title, updated, children }: {
  title: string; updated: string; children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>← Inicio</Link>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', margin: '16px 0 6px', letterSpacing: '-0.02em' }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-4)', margin: '0 0 32px' }}>Última actualización: {updated}</p>
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '32px 36px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '28px 0 10px' }}>{children}</h2>
}
