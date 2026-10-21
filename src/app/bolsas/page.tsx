'use client'

/**
 * Hoja de empaque del Rock Show, pensada para el celular.
 *
 * El dueño separa las figuras en bolsas y marca cada una con un número. Esta
 * pantalla es esa hoja: el número grande a la izquierda y las piezas enseguida,
 * para empacar leyendo hacia abajo sin abrir nada, y para encontrar la bolsa
 * cuando el cliente llega diciendo "soy el 5".
 *
 * Vive fuera de /admin a propósito: en el evento se abre directo, sin pasar por
 * la lista larga de tarjetas de administración.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { normalizarTelefono } from '@/lib/entregas'

type Contacto = { id: string; nombre: string; telefono: string; email: string | null }
type Entrega = {
  id: string; created_at: string; numero: number | null
  tipo: 'envio' | 'rock_show'; paqueteria: string | null; recibe: string | null
  direccion: Record<string, string> | null
  piezas: string; foto: string | null; resta: number; status: string
  nombre_enviado: string | null; email_enviado: string | null
  contacto: Contacto | null
}

type Filtro = 'pendientes' | 'entregadas' | 'envios'

const sinAcentos = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function BolsasPage() {
  const { profile, loading } = useAuth()
  const esDueno = !!profile?.is_admin

  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('pendientes')
  const [busca, setBusca] = useState('')
  const [marcando, setMarcando] = useState<string | null>(null)

  useEffect(() => {
    if (!esDueno) return
    fetch('/api/admin/entregas')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(d => setEntregas(d.entregas ?? []))
      .catch(() => setError('No se pudieron cargar las entregas.'))
      .finally(() => setCargando(false))
  }, [esDueno])

  async function marcar(e: Entrega, nuevo: 'atendida' | 'nueva') {
    if (e.status === 'conflicto' && nuevo === 'atendida') {
      const ok = window.confirm(
        `Esta entrega está marcada como conflicto: el celular ya era de otro contacto y la persona dijo "no soy yo". ` +
        `Al marcarla entregada se pierde esa marca. ¿Seguir?`
      )
      if (!ok) return
    }
    setMarcando(e.id)
    try {
      const res = await fetch('/api/admin/entregas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id, status: nuevo }),
      })
      if (!res.ok) { setError('No se pudo actualizar. Intenta de nuevo.'); return }
      // El número se libera al atender y se reasigna al regresar a pendiente,
      // así que se vuelve a leer la lista en vez de adivinar el estado nuevo.
      const r = await fetch('/api/admin/entregas')
      if (r.ok) setEntregas((await r.json()).entregas ?? [])
    } catch {
      setError('No hay conexión.')
    } finally {
      setMarcando(null)
    }
  }

  const visibles = useMemo(() => {
    const q = busca.trim()
    const tel = normalizarTelefono(q) ?? q.replace(/\D/g, '')
    const nom = sinAcentos(q)

    return entregas
      .filter(e => {
        if (filtro === 'envios') return e.tipo === 'envio'
        if (e.tipo !== 'rock_show') return false
        return filtro === 'entregadas' ? e.status === 'atendida' : e.status !== 'atendida'
      })
      .filter(e => {
        if (!q) return true
        const nombres = sinAcentos([e.contacto?.nombre, e.nombre_enviado, e.recibe].filter(Boolean).join(' '))
        const telefono = e.contacto?.telefono ?? ''
        return (nom && nombres.includes(nom)) || (tel.length >= 3 && telefono.includes(tel))
      })
      .sort((a, b) =>
        filtro === 'pendientes'
          ? (a.numero ?? 9999) - (b.numero ?? 9999)
          : b.created_at.localeCompare(a.created_at)
      )
  }, [entregas, filtro, busca])

  const pendientes = entregas.filter(e => e.tipo === 'rock_show' && e.status !== 'atendida').length

  if (loading) return <Centro>Cargando…</Centro>
  if (!esDueno) {
    return (
      <Centro>
        <Icon name="lock" size={28} />
        <p style={{ color: 'var(--ink-3)', marginTop: 12 }}>Esta pantalla es solo para el administrador.</p>
        <Link href="/" style={{ color: 'var(--accent)', fontSize: 14 }}>Volver a la tienda</Link>
      </Centro>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Encabezado pegado: en el evento se busca con el pulgar sin subir */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--paper)',
        borderBottom: '1px solid var(--line)', padding: '14px 16px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Bolsas del Rock Show</h1>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{pendientes} por entregar</span>
          <Link href="/admin" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>Panel</Link>
        </div>

        <input
          type="search" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nombre o celular…" aria-label="Buscar por nombre o celular"
          className="input" style={{ width: '100%', marginBottom: 10 }}
        />

        <div style={{ display: 'flex', gap: 6 }}>
          {([['pendientes', 'Por entregar'], ['entregadas', 'Entregadas'], ['envios', 'Envíos']] as const).map(([f, etiqueta]) => (
            <button
              key={f} type="button" onClick={() => setFiltro(f)}
              style={{
                flex: 1, minHeight: 40, borderRadius: 999, cursor: 'pointer', fontSize: 13,
                fontWeight: filtro === f ? 650 : 500,
                background: filtro === f ? 'var(--accent)' : 'var(--paper)',
                color: filtro === f ? '#fff' : 'var(--ink-2)',
                border: `1px solid ${filtro === f ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >{etiqueta}</button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ margin: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {cargando ? <Centro>Cargando entregas…</Centro>
        : visibles.length === 0 ? <Centro>{busca ? 'Nadie con ese nombre o celular.' : 'Nada aquí todavía.'}</Centro>
        : (
          <div>
            {visibles.map(e => (
              <Fila key={e.id} e={e} marcando={marcando === e.id} onMarcar={marcar} />
            ))}
          </div>
        )}
    </div>
  )
}

function Fila({ e, marcando, onMarcar }: {
  e: Entrega; marcando: boolean
  onMarcar: (e: Entrega, nuevo: 'atendida' | 'nueva') => void
}) {
  const atendida = e.status === 'atendida'
  const nombre = e.contacto?.nombre ?? e.nombre_enviado ?? '—'
  const piezas = e.piezas.split('\n').map(l => l.trim()).filter(Boolean)
  const dir = e.direccion

  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '14px 16px', borderBottom: '1px solid var(--line)',
      background: e.status === 'conflicto' ? '#FFFBEB' : 'var(--paper)',
      opacity: atendida ? 0.55 : 1,
    }}>
      {e.tipo === 'rock_show' && (
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 800,
        }}>{e.numero ?? '—'}</div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--ink)' }}>
          {nombre}
          {e.resta > 0 && (
            <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEF2F2', color: '#B91C1C' }}>
              DEBE ${e.resta.toLocaleString('es-MX')}
            </span>
          )}
          {e.status === 'conflicto' && (
            <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#92400E' }}>
              CONFLICTO
            </span>
          )}
        </div>

        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
          {e.contacto?.telefono ?? '—'}
        </div>

        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 6 }}>
          {piezas.map((p, i) => <div key={i}>{p}</div>)}
        </div>

        {e.tipo === 'envio' && dir && (
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            {e.paqueteria} · {dir.calle} {dir.numExt}{dir.numInt ? ` int. ${dir.numInt}` : ''}, {dir.colonia}, {dir.cp} {dir.ciudad}
          </div>
        )}

        {e.foto && (
          <a href={e.foto} target="_blank" rel="noopener noreferrer"
             style={{ display: 'inline-block', marginTop: 6, fontSize: 12.5, color: 'var(--accent)' }}>
            Ver foto
          </a>
        )}
      </div>

      <button
        type="button" disabled={marcando}
        onClick={() => onMarcar(e, atendida ? 'nueva' : 'atendida')}
        style={{
          minHeight: 44, minWidth: 88, borderRadius: 11, cursor: marcando ? 'wait' : 'pointer',
          fontSize: 13, fontWeight: 650, alignSelf: 'center', padding: '0 12px',
          background: atendida ? 'var(--paper)' : '#F0FDF4',
          color: atendida ? 'var(--ink-3)' : '#166534',
          border: `1px solid ${atendida ? 'var(--line)' : '#BBF7D0'}`,
        }}
      >
        {marcando ? '…' : atendida ? 'Regresar' : 'Entregado'}
      </button>
    </div>
  )
}

function Centro({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)',
      fontSize: 15, padding: 24, textAlign: 'center',
    }}>{children}</div>
  )
}
