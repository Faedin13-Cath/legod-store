import Link from 'next/link'
import Icon from '@/components/ui/Icon'


export default function PedidosPage() {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 24px' }}>Mis pedidos</h1>
      <div style={{
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 16, padding: '56px', textAlign: 'center',
      }}>
        <Icon name="package" size={32} />
        <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>Aún no tienes pedidos.</p>
        <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 16 }}>
          Ver tienda
        </Link>
      </div>
    </div>
  )
}
