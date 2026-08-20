'use client'

import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

const OWNER_EMAIL = 'faedin@hotmail.com'

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const isOwner = (profile?.email ?? '').toLowerCase() === OWNER_EMAIL

  if (loading) {
    return <div style={{ color: 'var(--ink-3)', fontSize: 15, padding: '40px 0' }}>Cargando…</div>
  }

  if (!isOwner) {
    return (
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
        <Icon name="lock" size={28} />
        <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>Esta sección es solo para el administrador.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Administración</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
          Herramientas de la tienda. Solo tú ves esta sección.
        </p>
      </div>

      {/* Envíos — carga masiva de paqueterías */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="truck" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Envíos — Estafeta</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 16px' }}>
          Descarga las direcciones de <strong>todos los clientes</strong> en el formato de carga masiva
          (Multiguía) de Estafeta. Súbelo directo en el portal de Estafeta para generar las guías.
          Solo incluye pedidos que eligieron Estafeta.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/api/admin/estafeta?scope=pending" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            <Icon name="truck" size={14} /> Pendientes por enviar
          </a>
          <a href="/api/admin/estafeta?scope=all" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            Descargar todos
          </a>
        </div>
        <p style={{ fontSize: 11, color: 'var(--ink-4)', margin: '12px 0 0', lineHeight: 1.5 }}>
          El peso (1 kg) y dimensiones (20×15×25 cm) van con valores por defecto — ajústalos en el CSV
          si alguna figura es más grande.
        </p>
      </div>
    </div>
  )
}
