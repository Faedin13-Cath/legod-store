'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const steps = [
  { n: '01', title: 'Mándanos fotos',   desc: 'Fotografía tus piezas con buena luz y mándanos el álbum por WhatsApp o Instagram DM. Incluye el estado de cada figura.' },
  { n: '02', title: 'Cotizamos en 24h', desc: 'Revisamos tu colección y te mandamos una oferta en 24 horas hábiles. Si hay piezas que no podemos tomar, te lo decimos también.' },
  { n: '03', title: 'Aceptas y envías', desc: 'Si aceptas la oferta, te damos los datos para el envío (lo puedes pagar vía Estafeta, FedEx o Correos). Nosotros cubrimos el envío si el lote supera $2,000 MXN.' },
  { n: '04', title: 'Recibes tu pago',  desc: 'Una vez que recibimos y verificamos las piezas, hacemos la transferencia en el mismo día.' },
]

const accepts = [
  'Minifiguras LEGO originales — nuevo, perfecto o crack leve',
  'Sets sellados, cajas cerradas originales',
  'Sets usados completos o con pocas piezas faltantes',
  'Colecciones grandes (50+ piezas)',
  'Series exclusivas, Star Wars, Marvel, DC, Harry Potter',
]

const notAccepts = [
  'Piezas sueltas sin clasificar',
  'Figuras con partes rotas o muy incompletas',
  'Copias o clones (Lepin, Lele, etc.)',
  'Sets dañados o con caja deteriorada',
  'Piezas de terceros no LEGO',
]

export default function VendenosPage() {
  const [sent, setSent] = useState(false)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 32px 80px' }}>
        {/* Hero */}
        <div style={{ maxWidth: 600, marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 10px' }}>
            COMPRA DE COLECCIONES
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.2 }}>
            Véndenos tu colección
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', margin: 0, lineHeight: 1.7 }}>
            ¿Tienes figuras que ya no usas? Las compramos. Proceso 100% transparente, precio justo y pago el mismo día que recibimos las piezas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Left */}
          <div>
            {/* Steps */}
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
              Cómo funciona
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', gap: 20, paddingBottom: i < steps.length - 1 ? 28 : 0, position: 'relative' }}>
                  {/* Line */}
                  {i < steps.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 19, top: 40, bottom: 0, width: 2,
                      background: 'var(--line)',
                    }} />
                  )}
                  {/* Number */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                  }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* What we accept */}
            <div style={{ marginTop: 36 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
                Qué aceptamos
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="check" size={13} /> SÍ aceptamos
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {accepts.map(a => (
                      <li key={a} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}><Icon name="check" size={12} /></span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="close" size={13} /> NO aceptamos
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {notAccepts.map(a => (
                      <li key={a} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }}><Icon name="close" size={12} /></span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
              Iniciar cotización
            </h2>
            {!sent ? (
              <div style={{
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '28px',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu nombre</label>
                  <input type="text" placeholder="Nombre completo" className="input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono (WhatsApp)</label>
                  <input type="tel" placeholder="+52 55 ..." className="input" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>¿Qué tienes para vender?</label>
                  <textarea
                    rows={4}
                    placeholder="Describe tus piezas: nombres, cantidades, estado. Ej: Jango Fett perfecto, 3x Star Wars variados, set de Harry Potter sin caja..."
                    className="input" style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: 'var(--accent-soft)', border: '1px solid var(--accent)',
                  fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5,
                }}>
                  <strong style={{ color: 'var(--accent)' }}>💡 Tip:</strong> Puedes también mandarnos fotos directamente por{' '}
                  <a href="https://wa.me/5215512345678" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>WhatsApp</a>{' '}
                  o{' '}
                  <a href="https://instagram.com/legodstore" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>Instagram DM</a> —
                  es el método más rápido.
                </div>
                <button onClick={() => setSent(true)} className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '11px 28px' }}>
                  Solicitar cotización →
                </button>
              </div>
            ) : (
              <div style={{
                background: 'var(--paper)', border: '1px solid var(--success-border)',
                borderRadius: 16, padding: '48px 28px', textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--success-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', color: 'var(--success)',
                }}>
                  <Icon name="check" size={22} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>¡Solicitud recibida!</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  Te contactamos en las próximas 24 horas hábiles con la cotización.
                </p>
                <button onClick={() => setSent(false)} className="btn btn-secondary">Nueva solicitud</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
