import Link from 'next/link'

export default function ProductoNoEncontrado() {
  return (
    <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center', padding: '0 32px' }}>
      <h1 style={{ color: 'var(--ink)', marginBottom: 12 }}>Producto no encontrado</h1>
      <p style={{ color: 'var(--ink-3)', marginBottom: 24 }}>Puede que ya no esté disponible.</p>
      <Link href="/tienda" style={{ color: 'var(--accent)', fontWeight: 500 }}>← Volver a la tienda</Link>
    </div>
  )
}
