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
import {
  copiarEntregas as copiarEntregasVisibles,
  bajarExcelEstafeta as bajarExcelEstafetaVisibles,
  sinAcentos,
} from '@/lib/entregas-export'

type Contacto = { id: string; nombre: string; telefono: string; email: string | null }
type Entrega = {
  id: string; created_at: string; numero: number | null
  tipo: 'envio' | 'rock_show'; paqueteria: string | null; recibe: string | null
  direccion: Record<string, string> | null
  piezas: string; foto: string | null; resta: number; status: string
  nombre_enviado: string | null; email_enviado: string | null
  contacto: Contacto | null
}

type Seccion = 'rock' | 'envios'
type FiltroRock = 'pendientes' | 'entregadas'

export default function BolsasPage() {
  const { profile, loading } = useAuth()
  const esDueno = !!profile?.is_admin

  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [seccion, setSeccion] = useState<Seccion>('rock')
  const [filtroRock, setFiltroRock] = useState<FiltroRock>('pendientes')
  const [busca, setBusca] = useState('')
  const [marcando, setMarcando] = useState<string | null>(null)
  const [avisoExport, setAvisoExport] = useState('')
  const [textoParaCopiar, setTextoParaCopiar] = useState('')
  const [bajandoExcel, setBajandoExcel] = useState(false)

  // Dos lecturas: TODAS las pendientes (sin tope: retienen su número aunque sean
  // viejas) y las más recientes, que aportan las entregadas. Se mezclan por id.
  async function leer(): Promise<Entrega[]> {
    const [pend, rec] = await Promise.all([
      fetch('/api/admin/entregas?pendientes=1'),
      fetch('/api/admin/entregas').catch(() => null),
    ])
    if (!pend.ok) throw new Error(String(pend.status))
    const lista: Entrega[] = (await pend.json()).entregas ?? []
    if (rec?.ok) {
      const vistos = new Set(lista.map(x => x.id))
      for (const x of ((await rec.json()).entregas ?? []) as Entrega[]) if (!vistos.has(x.id)) lista.push(x)
    }
    return lista
  }

  useEffect(() => {
    if (!esDueno) return
    leer()
      .then(setEntregas)
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
    setError('')
    setAviso('')
    setMarcando(e.id)
    try {
      const res = await fetch('/api/admin/entregas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: e.id, status: nuevo }),
      })
      const resp = await res.json().catch(() => null) as { error?: string; numero?: number | null; renumerado?: boolean } | null
      if (!res.ok) { setError(resp?.error ?? 'No se pudo actualizar. Intenta de nuevo.'); return }
      if (resp?.renumerado && resp.numero != null) {
        const quien = e.contacto?.nombre ?? e.nombre_enviado ?? 'este cliente'
        setAviso('Su número anterior ya lo tiene otra bolsa. Vuelve a marcar la bolsa de ' + quien + ' con el ' + resp.numero + '.')
      }
      // El número se libera al atender y puede reasignarse al regresar a pendiente,
      // así que se vuelve a leer la lista en vez de adivinar el estado nuevo.
      try { setEntregas(await leer()) } catch { /* se queda la lista anterior */ }
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
        if (seccion === 'envios') return e.tipo === 'envio'
        if (e.tipo !== 'rock_show') return false
        return filtroRock === 'entregadas' ? e.status === 'atendida' : e.status !== 'atendida'
      })
      .filter(e => {
        if (!q) return true
        const nombres = sinAcentos([e.contacto?.nombre, e.nombre_enviado, e.recibe].filter(Boolean).join(' '))
        const telefono = e.contacto?.telefono ?? ''
        return (nom && nombres.includes(nom)) || (tel.length >= 3 && telefono.includes(tel))
      })
      .sort((a, b) =>
        seccion === 'rock' && filtroRock === 'pendientes'
          ? (a.numero ?? 9999) - (b.numero ?? 9999)
          : b.created_at.localeCompare(a.created_at)
      )
  }, [entregas, seccion, filtroRock, busca])

  // Los dos botones de exportar trabajan sobre lo que se ve, en cualquier filtro.
  async function copiar() {
    setAvisoExport(''); setTextoParaCopiar('')
    const r = await copiarEntregasVisibles(visibles)
    setAvisoExport(r.aviso); setTextoParaCopiar(r.textoManual)
  }

  async function bajarExcel() {
    setBajandoExcel(true); setAvisoExport('')
    const r = await bajarExcelEstafetaVisibles(visibles)
    setAvisoExport(r.aviso)
    setBajandoExcel(false)
  }

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
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Encabezado pegado: en el evento se busca con el pulgar sin subir */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--paper)',
        borderBottom: '1px solid var(--line)', padding: '18px 16px 12px',
      }}>
        {/* Dos mundos distintos: las bolsas que se entregan en mano y los
            paquetes que salen por paquetería. Cada uno con lo suyo adentro. */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {([['rock', 'Entregas Rock'], ['envios', 'Envíos']] as const).map(([s, etiqueta]) => {
            const activa = seccion === s
            return (
              <button
                key={s} type="button" onClick={() => setSeccion(s)}
                style={{
                  flex: 1, minHeight: 46, borderRadius: 12, cursor: 'pointer', fontSize: 14,
                  fontWeight: activa ? 700 : 500,
                  background: activa ? 'var(--accent)' : 'transparent',
                  color: activa ? '#fff' : 'var(--ink-2)',
                  border: `1px solid ${activa ? 'var(--accent)' : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                <Icon name={s === 'rock' ? 'package' : 'truck'} size={16} />
                {etiqueta}
              </button>
            )
          })}
        </div>

        <input
          type="search" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nombre o celular…" aria-label="Buscar por nombre o celular"
          className="input" style={{ width: '100%' }}
        />

        {seccion === 'rock' ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {([['pendientes', 'Por entregar'], ['entregadas', 'Entregadas']] as const).map(([f, etiqueta]) => (
              <button
                key={f} type="button" onClick={() => setFiltroRock(f)}
                style={{
                  flex: 1, minHeight: 40, borderRadius: 999, cursor: 'pointer', fontSize: 13,
                  fontWeight: filtroRock === f ? 650 : 500,
                  background: filtroRock === f ? 'var(--accent-soft)' : 'transparent',
                  color: filtroRock === f ? 'var(--accent)' : 'var(--ink-3)',
                  border: `1px solid ${filtroRock === f ? 'var(--accent-soft)' : 'var(--line)'}`,
                }}
              >
                {etiqueta}
                {/* La cuenta de pendientes es lo que mira al llegar al evento. */}
                {f === 'pendientes' && pendientes > 0 && ` · ${pendientes}`}
              </button>
            ))}
          </div>
        ) : (
          /* Exportar: siempre sobre lo que se ve en pantalla. */
          <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', flex: 1 }}>
              {visibles.length} envío{visibles.length === 1 ? '' : 's'}
            </span>
            <BotonIcono
              icono="copy" titulo="Copiar para pegar en una hoja"
              onClick={copiar} disabled={visibles.length === 0}
            />
            <BotonIcono
              icono="download" titulo="Bajar a Excel para las guías de Estafeta"
              onClick={bajarExcel} disabled={visibles.length === 0 || bajandoExcel} ocupado={bajandoExcel}
            />
          </div>
        )}
      </div>

      {avisoExport && (
        <p role="status" style={{ fontSize: 13, color: 'var(--ink-2)', margin: '12px 16px 0', lineHeight: 1.6 }}>{avisoExport}</p>
      )}
      {textoParaCopiar && (
        <textarea
          readOnly value={textoParaCopiar} onFocus={e => e.currentTarget.select()}
          aria-label="Texto para copiar a mano"
          style={{ display: 'block', width: 'calc(100% - 32px)', margin: '8px 16px 0', height: 140, fontSize: 12, fontFamily: 'monospace' }}
        />
      )}

      {error && (
        <div style={{ margin: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {aviso && (
        <div role="status" style={{ margin: 16, background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#92400E', lineHeight: 1.5 }}>
          {aviso}
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
          {e.tipo === 'rock_show' && e.numero == null && (
            <span style={{ marginLeft: 7, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#FEF3C7', color: '#92400E' }}>
              SIN NÚMERO
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
          {piezas.map((p, i) => <div key={i} style={{ overflowWrap: 'anywhere' }}>{p}</div>)}
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

/** Botón de solo icono: en el encabezado el espacio es poco y el título lo explica. */
function BotonIcono({ icono, titulo, onClick, disabled, ocupado }: {
  icono: string; titulo: string; onClick: () => void; disabled?: boolean; ocupado?: boolean
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      title={titulo} aria-label={titulo}
      style={{
        width: 44, height: 44, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--paper)', border: '1px solid var(--line)',
        color: disabled ? 'var(--ink-3)' : 'var(--ink)',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon name={ocupado ? 'clock' : icono} size={18} />
    </button>
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
