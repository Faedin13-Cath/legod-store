'use client'

import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { shippingCost } from '@/lib/shipping'

export type ShippingData = {
  name: string; phone: string
  street: string; numExt: string; numInt: string
  colonia: string; city: string; state: string; zip: string; ref: string
  carrier: string
}

// Opciones de entrega. "Recoger en tienda" es gratis (entrega personal en CDMX).
export const CARRIERS = ['Recoger en tienda', 'Estafeta', 'Correos de México', 'FedEx'] as const

type Props = {
  open:        boolean
  title:       string
  /** Monto que se descontará del saldo. */
  amount:      number
  /** Total del pedido (para el resumen). */
  total:       number
  /** Si true, pide dirección de envío. Si false, solo confirma. */
  needShipping: boolean
  loading?:    boolean
  onCancel:    () => void
  onConfirm:   (shipping?: ShippingData) => void
}

const field = (label: string, value: string, onChange: (v: string) => void, opts: { required?: boolean; placeholder?: string; half?: boolean } = {}) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: opts.half ? '1 1 45%' : '1 1 100%' }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)' }}>
      {label}{opts.required && <span style={{ color: 'var(--danger)' }}> *</span>}
    </span>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={opts.placeholder}
      style={{
        padding: '9px 11px', borderRadius: 8, fontSize: 13,
        border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)',
      }}
    />
  </label>
)

export default function SaldoConfirmModal({ open, title, amount, total, needShipping, loading, onCancel, onConfirm }: Props) {
  const { profile } = useAuth()
  const [name,    setName]    = useState(profile?.ship_name    ?? profile?.name ?? '')
  const [phone,   setPhone]   = useState(profile?.ship_phone   ?? profile?.whatsapp ?? '')
  const [street,  setStreet]  = useState(profile?.ship_street  ?? '')
  const [numExt,  setNumExt]  = useState(profile?.ship_num_ext ?? '')
  const [numInt,  setNumInt]  = useState(profile?.ship_num_int ?? '')
  const [colonia, setColonia] = useState(profile?.ship_colonia ?? '')
  const [city,    setCity]    = useState(profile?.ship_city    ?? '')
  const [state,   setState]   = useState(profile?.ship_state   ?? '')
  const [zip,     setZip]     = useState(profile?.ship_zip     ?? '')
  const [ref,     setRef]     = useState(profile?.ship_ref     ?? '')
  const [carrier, setCarrier] = useState<string>(CARRIERS[1])

  // Bloquea el scroll del fondo mientras el modal está abierto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const pickup = carrier === 'Recoger en tienda'
  const ship   = needShipping ? shippingCost(carrier) : 0
  const grand  = amount + ship  // lo que se descuenta del saldo (producto + envío)
  // Recoger en tienda solo necesita nombre + teléfono; envío necesita dirección completa.
  const missing = needShipping && (
    !name.trim() || !phone.trim() ||
    (!pickup && (!street.trim() || !numExt.trim() || !city.trim() || !state.trim() || !zip.trim()))
  )

  function confirm() {
    if (missing) return
    onConfirm(needShipping ? { name, phone, street, numExt, numInt, colonia, city, state, zip, ref, carrier } : undefined)
  }

  return (
    <div
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(26,30,90,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 440, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--paper)', borderRadius: 18, border: '1px solid var(--line)', boxShadow: 'var(--shadow-modal)', padding: '24px 26px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="gift-card" size={19} />
          </div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{title}</h2>
        </div>

        {/* Resumen del cargo */}
        <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', margin: '14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)', marginBottom: 4 }}>
            <span>Total del pedido</span>
            <span style={{ fontWeight: 600 }}>${total.toLocaleString('es-MX')} MXN</span>
          </div>
          {needShipping && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink-2)', marginBottom: 6 }}>
              <span>Envío ({carrier})</span>
              <span style={{ fontWeight: 600 }}>{ship === 0 ? 'Gratis' : `$${ship.toLocaleString('es-MX')} MXN`}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--accent)', fontWeight: 700, borderTop: '1px solid var(--line)', paddingTop: 6 }}>
            <span>Se descuenta de tu saldo</span>
            <span>−${grand.toLocaleString('es-MX')} MXN</span>
          </div>
        </div>

        {needShipping && (
          <>
            {/* Entrega */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 8px' }}>
              Entrega
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {CARRIERS.map(c => {
                const on = carrier === c
                const p  = shippingCost(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrier(c)}
                    style={{
                      flex: '1 1 40%', padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                      fontSize: 12, fontWeight: on ? 700 : 500, lineHeight: 1.3,
                      background: on ? 'var(--accent-soft)' : 'var(--paper)',
                      border: `1.5px solid ${on ? 'var(--accent)' : 'var(--line)'}`,
                      color: on ? 'var(--accent)' : 'var(--ink-2)',
                      transition: 'all .12s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}
                  >
                    <span>{c}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--accent)' : 'var(--ink-3)' }}>
                      {p === 0 ? 'Gratis' : `$${p} MXN`}
                    </span>
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 16 }}>
              {pickup
                ? 'Entrega personal en CDMX (punto medio o sábados en el Rock Show). Coordinamos por WhatsApp.'
                : 'El costo del envío se suma al total y se descuenta de tu saldo.'}
            </div>

            {pickup ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {field('Nombre completo', name, setName, { required: true })}
                {field('Teléfono', phone, setPhone, { required: true, placeholder: '55 1234 5678' })}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '4px 0 10px' }}>
                  ¿A dónde lo enviamos?
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {field('Nombre completo', name, setName, { required: true })}
                  {field('Teléfono', phone, setPhone, { required: true, half: true, placeholder: '55 1234 5678' })}
                  {field('Código postal', zip, setZip, { required: true, half: true, placeholder: '00000' })}
                  {field('Calle', street, setStreet, { required: true })}
                  {field('Núm. exterior', numExt, setNumExt, { required: true, half: true, placeholder: '123' })}
                  {field('Núm. interior', numInt, setNumInt, { half: true, placeholder: 'Opcional' })}
                  {field('Colonia', colonia, setColonia, {})}
                  {field('Ciudad / municipio', city, setCity, { required: true, half: true })}
                  {field('Estado', state, setState, { required: true, half: true })}
                  {field('Referencia (entre calles, color de casa…)', ref, setRef, {})}
                </div>
              </>
            )}
          </>
        )}

        {!needShipping && (
          <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: '4px 0 18px' }}>
            Estás por pagar con tu saldo. Esta acción descuenta el monto de tu cartera de inmediato. ¿Deseas continuar?
          </p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
            Cancelar
          </button>
          <button
            onClick={confirm}
            disabled={loading || missing}
            className="btn btn-primary"
            style={{ flex: 2, justifyContent: 'center', opacity: (loading || missing) ? 0.55 : 1 }}
          >
            {loading ? 'Procesando…' : `Confirmar pago · $${grand.toLocaleString('es-MX')}`}
          </button>
        </div>
        {missing && (
          <p style={{ fontSize: 11, color: 'var(--danger)', margin: '8px 0 0', textAlign: 'center' }}>
            Completa los campos obligatorios (*) para continuar.
          </p>
        )}
      </div>
    </div>
  )
}
