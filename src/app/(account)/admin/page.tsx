'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

const OWNER_EMAIL = 'faedin@hotmail.com'

type SellRequest = {
  id: string; created_at: string; name: string; phone: string
  description: string; payment: string | null; photos: string[]; status: string
}

export default function AdminPage() {
  const { profile, loading } = useAuth()
  const isOwner = (profile?.email ?? '').toLowerCase() === OWNER_EMAIL

  const [sells, setSells] = useState<SellRequest[]>([])
  const [loadingSells, setLoadingSells] = useState(true)

  useEffect(() => {
    if (!isOwner) return
    fetch('/api/admin/sell-requests')
      .then(r => r.ok ? r.json() : { requests: [] })
      .then(d => { setSells(d.requests ?? []); setLoadingSells(false) })
      .catch(() => setLoadingSells(false))
  }, [isOwner])

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

      {/* Solicitudes de venta (Véndenos) */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="package" size={18} />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            Solicitudes de venta
            {sells.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: 999, marginLeft: 8 }}>
                {sells.length}
              </span>
            )}
          </h2>
        </div>

        {loadingSells ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Cargando…</p>
        ) : sells.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Aún no hay solicitudes de clientes que quieran venderte piezas.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sells.map(s => {
              const date = new Date(s.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              const wa   = s.phone.replace(/\D/g, '')
              return (
                <div key={s.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', background: 'var(--cream)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.phone} · {date} · pago: {s.payment || '—'}</div>
                    </div>
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                      <Icon name="whatsapp" size={14} /> Responder
                    </a>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{s.description}</p>
                  {s.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {s.photos.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Foto ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
