'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const channels = [
  {
    icon: 'whatsapp',
    label: 'WhatsApp',
    value: '+52 55 7477 7350',
    href: 'https://wa.me/525574777350?text=Hola,%20tengo%20una%20pregunta%20sobre%20Jango%27s%20Store',
    desc: 'Respuesta en menos de 2 horas en horario hábil',
    cta: 'Abrir WhatsApp',
  },
  {
    icon: 'chat',
    label: 'Comunidad',
    value: 'Grupo de WhatsApp',
    href: 'https://chat.whatsapp.com/LklBq0iXRJvIFUiM8eUULH?mode=gi_t',
    desc: 'Restocks, promos y avisos antes que nadie',
    cta: 'Unirme al grupo',
  },
]

export default function ContactoPage() {
  // `web` es una trampa: está oculta para las personas, así que si llega con
  // texto es un bot rellenando todos los campos del formulario.
  const [form, setForm] = useState({ name: '', email: '', subject: '', msg: '', web: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'No se pudo enviar. Inténtalo de nuevo o escríbenos por WhatsApp.')
        setSending(false)
        return
      }
      setSent(true)
    } catch {
      setError('No se pudo enviar. Revisa tu conexión o escríbenos por WhatsApp.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 32px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>Contacto</h1>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
            Escríbenos por donde prefieras. Respondemos en menos de 24 horas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 48 }}>
          {/* Left: channels */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
              Canales directos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {channels.map(ch => (
                <div key={ch.label} style={{
                  background: 'var(--paper)', border: '1px solid var(--line)',
                  borderRadius: 14, padding: '18px 20px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
                      <Icon name={ch.icon as never} size={18} />
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{ch.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{ch.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{ch.desc}</div>
                  <a
                    href={ch.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 6, fontSize: 13, fontWeight: 500,
                      color: 'var(--ink)', textDecoration: 'none',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {ch.cta} <Icon name="chevron-right" size={12} />
                  </a>
                </div>
              ))}
            </div>

            {/* Hours */}
            <div style={{
              marginTop: 20, padding: '16px 20px',
              background: 'var(--cream-2)', border: '1px solid var(--line)',
              borderRadius: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>Horario de atención</div>
              <div>Lunes a viernes · 10:00 – 19:00 hrs CDMX</div>
              <div>Sábados · 9:00 – 18:00 hrs</div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
              Formulario de contacto
            </h2>

            {!sent ? (
              <form onSubmit={handleSubmit} style={{
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '28px',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                {/* Trampa para bots: fuera de pantalla y fuera del orden de
                    tabulación, así que nadie la ve ni la alcanza tecleando. */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label htmlFor="web-url">No llenar</label>
                  <input
                    id="web-url" name="web-url" type="text" tabIndex={-1} autoComplete="off"
                    value={form.web} onChange={e => setForm(f => ({ ...f, web: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                    <input
                      required type="text" placeholder="Tu nombre"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="input" style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                    <input
                      required type="email" placeholder="tu@email.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="input" style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asunto</label>
                  <select
                    value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="input" style={{ width: '100%' }}
                  >
                    <option value="">Selecciona un tema…</option>
                    <option>Consulta sobre un producto</option>
                    <option>Estado de un pedido</option>
                    <option>Cotización de envío</option>
                    <option>Apartado</option>
                    <option>Vender mi colección</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensaje</label>
                  <textarea
                    required rows={5} placeholder="Cuéntanos en qué podemos ayudarte…"
                    value={form.msg} onChange={e => setForm(f => ({ ...f, msg: e.target.value }))}
                    className="input" style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                {error && (
                  <div style={{ padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #F2BFBF', fontSize: 13, color: '#A23030' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={sending}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '11px 28px', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}
                >
                  {sending ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </form>
            ) : (
              <div style={{
                background: 'var(--paper)', border: '1px solid var(--success-border)',
                borderRadius: 16, padding: '48px 28px', textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', color: 'var(--success)',
                }}>
                  <Icon name="check" size={22} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>¡Mensaje enviado!</h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  Te respondemos en menos de 24 horas.
                </p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', msg: '', web: '' }) }} className="btn btn-secondary">
                  Enviar otro
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
