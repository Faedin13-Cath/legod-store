'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { shippingCost, CARRIERS_ENVIO } from '@/lib/shipping'

type OrderRow = {
  id: string; order_number: string; total_price: number
  line_items: { title: string; quantity: number }[]
  created_at: string
}
type Shipment = {
  id: string; carrier: string; cost: number; status: string
  tracking_number: string | null; created_at: string
}

function diasGuardado(desde: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(desde).getTime()) / 86_400_000))
}

export default function CasilleroPage() {
  const { profile } = useAuth()
  const [guardados, setGuardados] = useState<OrderRow[]>([])
  const [envios,    setEnvios]    = useState<Shipment[]>([])
  const [loading,   setLoading]   = useState(true)
  const [sel,       setSel]       = useState<Set<string>>(new Set())
  const [carrier,   setCarrier]   = useState<string>(CARRIERS_ENVIO[0])
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState('')

  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [street,  setStreet]  = useState('')
  const [numExt,  setNumExt]  = useState('')
  const [numInt,  setNumInt]  = useState('')
  const [colonia, setColonia] = useState('')
  const [city,    setCity]    = useState('')
  const [state,   setState]   = useState('')
  const [zip,     setZip]     = useState('')
  const [ref,     setRef]     = useState('')

  useEffect(() => {
    fetch('/api/casillero')
      .then(r => r.ok ? r.json() : { guardados: [], envios: [] })
      .then(d => {
        setGuardados(d.guardados ?? [])
        setEnvios(d.envios ?? [])
        setSel(new Set((d.guardados ?? []).map((o: OrderRow) => o.id)))
      })
      .finally(() => setLoading(false))
  }, [])

  // Rellena la dirección con la que ya tiene guardada en su perfil.
  useEffect(() => {
    if (!profile) return
    setName(profile.ship_name ?? profile.name ?? '')
    setPhone(profile.ship_phone ?? profile.whatsapp ?? '')
    setStreet(profile.ship_street ?? '')
    setNumExt(profile.ship_num_ext ?? '')
    setNumInt(profile.ship_num_int ?? '')
    setColonia(profile.ship_colonia ?? '')
    setCity(profile.ship_city ?? '')
    setState(profile.ship_state ?? '')
    setZip(profile.ship_zip ?? '')
    setRef(profile.ship_ref ?? '')
  }, [profile])

  const elegidos = guardados.filter(o => sel.has(o.id))
  const piezas   = elegidos.flatMap(o => o.line_items ?? []).reduce((s, li) => s + (li.quantity ?? 1), 0)
  const costo    = shippingCost(carrier)
  const falta = !name.trim() || !phone.trim() || !street.trim() || !numExt.trim()
             || !city.trim() || !state.trim() || !zip.trim()

  function toggle(id: string) {
    setSel(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  async function pedirEnvio() {
    setError(''); setSending(true)
    try {
      const res = await fetch('/api/casillero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: Array.from(sel), carrier,
          shipping: { name, phone, street, numExt, numInt, colonia, city, state, zip, ref },
        }),
      })
      const d = await res.json()
      if (d.checkoutUrl) { window.location.href = d.checkoutUrl; return }
      setError(d.error ?? 'No se pudo generar el cobro del envío.')
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  const campo = (label: string, value: string, onChange: (v: string) => void, opts: { req?: boolean; half?: boolean; ph?: string } = {}) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: opts.half ? '1 1 45%' : '1 1 100%' }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>
        {label}{opts.req && <span style={{ color: 'var(--danger)' }}> *</span>}
      </span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={opts.ph} className="input" style={{ width: '100%' }} />
    </label>
  )

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Mi casillero</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Lo que te estamos guardando. Junta lo que quieras y pide el envío una sola vez.
      </p>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
          Cargando…
        </div>
      ) : guardados.length === 0 ? (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '56px', textAlign: 'center' }}>
          <div style={{ color: 'var(--ink-4)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <Icon name="package" size={32} />
          </div>
          <p style={{ color: 'var(--ink-3)', margin: '0 0 8px', fontSize: 14 }}>Tu casillero está vacío.</p>
          <p style={{ color: 'var(--ink-4)', margin: '0 0 16px', fontSize: 13, lineHeight: 1.6, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
            Al comprar, elige <strong>&ldquo;Guardar en mi casillero&rdquo;</strong> en vez de una
            paquetería y te lo guardamos aquí sin costo.
          </p>
          <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {guardados.map(o => {
              const on   = sel.has(o.id)
              const dias = diasGuardado(o.created_at)
              return (
                <button
                  key={o.id}
                  onClick={() => toggle(o.id)}
                  style={{
                    textAlign: 'left', width: '100%', cursor: 'pointer',
                    background: 'var(--paper)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                    boxShadow: on ? '0 0 0 3px var(--accent-soft)' : 'none',
                    borderRadius: 14, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 12, transition: 'all .12s',
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                    background: on ? 'var(--accent)' : 'var(--paper)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <Icon name="check" size={11} color="#fff" />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                      {(o.line_items ?? []).map(li => `${li.title}${li.quantity > 1 ? ` ×${li.quantity}` : ''}`).join(', ') || `Pedido #${o.order_number}`}
                    </span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      Pedido #{o.order_number} · guardado {dias === 0 ? 'hoy' : dias === 1 ? 'hace 1 día' : `hace ${dias} días`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Pedir el envío */}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '22px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>
              Pedir mi envío
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 16px' }}>
              {sel.size === 0
                ? 'Selecciona arriba lo que quieres que te mandemos.'
                : `${sel.size} ${sel.size === 1 ? 'pedido' : 'pedidos'} · ${piezas} ${piezas === 1 ? 'pieza' : 'piezas'} en una sola caja.`}
            </p>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 8px' }}>
              Paquetería
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {CARRIERS_ENVIO.map(c => {
                const on = carrier === c
                return (
                  <button
                    key={c} type="button" onClick={() => setCarrier(c)}
                    style={{
                      flex: '1 1 30%', padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 12, fontWeight: on ? 700 : 500, lineHeight: 1.3,
                      background: on ? 'var(--accent-soft)' : 'var(--cream)',
                      border: `1.5px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                      color: on ? 'var(--accent)' : 'var(--ink-2)', transition: 'all .12s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}
                  >
                    <span>{c}</span>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>${shippingCost(c)} MXN</span>
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 10px' }}>
              ¿A dónde lo enviamos?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {campo('Nombre completo', name, setName, { req: true })}
              {campo('Teléfono', phone, setPhone, { req: true, half: true, ph: '55 1234 5678' })}
              {campo('Código postal', zip, setZip, { req: true, half: true, ph: '00000' })}
              {campo('Calle', street, setStreet, { req: true })}
              {campo('Núm. exterior', numExt, setNumExt, { req: true, half: true, ph: '123' })}
              {campo('Núm. interior', numInt, setNumInt, { half: true, ph: 'Opcional' })}
              {campo('Colonia', colonia, setColonia)}
              {campo('Ciudad / municipio', city, setCity, { req: true, half: true })}
              {campo('Estado', state, setState, { req: true, half: true })}
              {campo('Referencia', ref, setRef)}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '9px 13px', marginBottom: 12, fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              onClick={pedirEnvio}
              disabled={sending || sel.size === 0 || falta}
              className="btn btn-primary"
              style={{ width: '100%', height: 46, fontSize: 15, opacity: (sending || sel.size === 0 || falta) ? 0.55 : 1 }}
            >
              {sending ? 'Generando cobro…' : `Pagar envío · $${costo.toLocaleString('es-MX')} MXN`}
            </button>
            {falta && sel.size > 0 && (
              <p style={{ fontSize: 11, color: 'var(--danger)', margin: '8px 0 0', textAlign: 'center' }}>
                Completa los campos obligatorios (*) para continuar.
              </p>
            )}
          </div>
        </>
      )}

      {/* Envíos anteriores */}
      {envios.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>Envíos pedidos</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {envios.map(e => (
              <div key={e.id} style={{
                background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}><Icon name="truck" size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {e.carrier} · ${e.cost.toLocaleString('es-MX')} MXN
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                    {new Date(e.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {e.tracking_number && ` · Guía ${e.tracking_number}`}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999, flexShrink: 0,
                  background: e.status === 'shipped' ? '#DCFCE7' : e.status === 'paid' ? 'var(--accent-soft)' : 'var(--cream)',
                  color:      e.status === 'shipped' ? '#166534' : e.status === 'paid' ? 'var(--accent)' : 'var(--ink-3)',
                  border: `1px solid ${e.status === 'shipped' ? '#86EFAC' : e.status === 'paid' ? 'var(--accent)' : 'var(--line)'}`,
                }}>
                  {e.status === 'shipped' ? 'Enviado' : e.status === 'paid' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
