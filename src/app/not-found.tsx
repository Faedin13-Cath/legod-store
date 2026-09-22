import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center', padding: '0 32px' }}>
      <h1 style={{ color: 'var(--ink)', marginBottom: 12 }}>Esta página no existe</h1>
      <p style={{ color: 'var(--ink-3)', marginBottom: 24 }}>Puede que el enlace esté mal escrito o que la página ya no esté.</p>
      <Link href="/tienda" style={{ color: 'var(--accent)', fontWeight: 500 }}>Ir a la tienda →</Link>
    </div>
  )
}
