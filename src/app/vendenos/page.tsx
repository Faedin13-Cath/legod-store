'use client'

import { useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'

const WHATSAPP = '5215512345678'

const steps = [
  { n: '01', title: 'Mándanos fotos',   desc: 'Fotografía tus piezas con buena luz. Puedes subir hasta 10 fotos directamente aquí o mandárnoslas por WhatsApp.' },
  { n: '02', title: 'Cotizamos en 24h', desc: 'Revisamos tu colección y te mandamos una oferta en 24 horas hábiles. Si hay piezas que no podemos tomar, te lo decimos también.' },
  { n: '03', title: 'Aceptas y envías', desc: 'Si aceptas la oferta, te damos los datos para el envío. Cubrimos el envío si el lote supera $2,000 MXN.' },
  { n: '04', title: 'Recibes tu pago',  desc: 'Una vez que recibimos y verificamos las piezas, procesamos tu pago el mismo día en la forma que prefieras.' },
]

const accepts = [
  'Minifiguras LEGO originales — nuevo, perfecto o crack leve',
  'Sets sellados, cajas cerradas originales',
  'Sets usados completos o con pocas piezas faltantes',
  'Colecciones grandes (50+ piezas)',
  'Series exclusivas, Star Wars, Marvel, DC, Harry Potter',
]

const notAccepts = [
  'Copias o clones (Lepin, Lele, etc.)',
  'Piezas de terceros no LEGO',
]

const PAYMENT_OPTIONS = [
  { value: 'efectivo',      label: 'Efectivo',           icon: 'cash' },
  { value: 'transferencia', label: 'Transferencia',       icon: 'bank' },
  { value: 'credito',       label: 'Crédito en tienda',  icon: 'gift-card' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--paper)',
  fontSize: 16, // 16px evita zoom automático en iOS al hacer focus
  color: 'var(--ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink-3)',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export default function VendenosPage() {
  const [name,        setName]        = useState('')
  const [phone,       setPhone]       = useState('')
  const [description, setDescription] = useState('')
  const [payment,     setPayment]     = useState('')
  const [photos,      setPhotos]      = useState<File[]>([])
  const [previews,    setPreviews]    = useState<string[]>([])
  const [dragOver,    setDragOver]    = useState(false)
  const [sent,        setSent]        = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | null) {
    if (!files) return
    const slots = 10 - photos.length
    if (slots <= 0) return
    const toAdd = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, slots)
    if (!toAdd.length) return
    const base = photos.length
    setPhotos(prev => [...prev, ...toAdd])
    toAdd.forEach((f, i) => {
      const reader = new FileReader()
      reader.onload = e => setPreviews(prev => {
        const next = [...prev]
        next[base + i] = e.target?.result as string
        return next
      })
      reader.readAsDataURL(f)
    })
  }

  function removePhoto(i: number) {
    setPhotos(prev => prev.filter((_, idx) => idx !== i))
    setPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const [sending, setSending] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit() {
    setSending(true)
    setError('')
    try {
      const payLabel = PAYMENT_OPTIONS.find(p => p.value === payment)?.label ?? ''
      const fd = new FormData()
      fd.append('name', name)
      fd.append('phone', phone)
      fd.append('description', description)
      fd.append('payment', payLabel)
      photos.forEach(f => fd.append('photos', f))

      const res = await fetch('/api/sell', { method: 'POST', body: fd })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'No se pudo enviar. Inténtalo de nuevo o escríbenos por WhatsApp.')
        setSending(false)
        return
      }
      setSent(true)
    } catch {
      setError('No se pudo enviar. Revisa tu conexión o escríbenos por WhatsApp.')
      setSending(false)
    }
  }

  const canSubmit = name.trim() && phone.trim() && description.trim() && payment

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="vendenos-wrap" style={{ maxWidth: 1060, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* Hero */}
        <div style={{ maxWidth: 600, marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 10px' }}>
            COMPRA DE COLECCIONES
          </p>
          <h1 className="vendenos-h1" style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.2 }}>
            Véndenos tu colección
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', margin: 0, lineHeight: 1.7 }}>
            ¿Tienes figuras que ya no usas? Las compramos. Proceso 100% transparente, precio justo y pago el mismo día que recibimos las piezas.
          </p>
        </div>

        <div className="vendenos-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* Left — steps + accepts */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
              Cómo funciona
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {steps.map((s, i) => (
                <div key={s.n} style={{ display: 'flex', gap: 20, paddingBottom: i < steps.length - 1 ? 28 : 0, position: 'relative' }}>
                  {i < steps.length - 1 && (
                    <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: 'var(--line)' }} />
                  )}
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

            <div style={{ marginTop: 36 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
                Qué aceptamos
              </h2>
              <div className="vendenos-accepts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

          {/* Right — form */}
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
              Iniciar cotización
            </h2>

            {!sent ? (
              <div style={{
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '24px',
                display: 'flex', flexDirection: 'column', gap: 18,
              }}>

                {/* Nombre */}
                <div>
                  <label style={labelStyle}>Tu nombre</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label style={labelStyle}>Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="+52 55 ..."
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label style={labelStyle}>¿Qué tienes para vender?</label>
                  <textarea
                    rows={4}
                    placeholder="Describe tus piezas: nombres, cantidades, estado. Ej: Jango Fett perfecto, 3x Star Wars variados, set de Harry Potter sin caja..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Pago preferido */}
                <div>
                  <label style={labelStyle}>¿Cómo te gustaría recibir el pago?</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {PAYMENT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPayment(opt.value)}
                        style={{
                          flex: 1,
                          padding: '10px 8px',
                          borderRadius: 10,
                          border: `2px solid ${payment === opt.value ? 'var(--accent)' : 'var(--line)'}`,
                          background: payment === opt.value ? 'var(--accent-soft)' : 'var(--paper)',
                          color: payment === opt.value ? 'var(--accent)' : 'var(--ink-2)',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all .12s',
                        }}
                      >
                        <Icon name={opt.icon} size={22} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fotos */}
                <div>
                  <label style={labelStyle}>
                    Fotos de tus piezas
                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: 'var(--ink-4)' }}>
                      ({photos.length}/10)
                    </span>
                  </label>

                  {/* Drop zone */}
                  {photos.length < 10 && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
                      style={{
                        border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--line)'}`,
                        borderRadius: 12,
                        padding: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragOver ? 'var(--accent-soft)' : 'var(--cream)',
                        transition: 'all .12s',
                        marginBottom: photos.length > 0 ? 12 : 0,
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                        Arrastra fotos aquí o <span style={{ color: 'var(--accent)' }}>selecciona archivos</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>
                        Hasta {10 - photos.length} foto{10 - photos.length !== 1 ? 's' : ''} más · JPG, PNG, HEIC
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => addFiles(e.target.files)}
                      />
                    </div>
                  )}

                  {/* Photo previews */}
                  {previews.length > 0 && (
                    <div className="vendenos-photos" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                      {previews.map((src, i) => src && (
                        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            onClick={() => removePhoto(i)}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              width: 20, height: 20, borderRadius: '50%',
                              background: 'rgba(0,0,0,0.6)', border: 'none',
                              color: '#fff', fontSize: 12, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info tip */}
                <div style={{
                  padding: '11px 14px', borderRadius: 10,
                  background: 'var(--accent-soft)', border: '1px solid var(--accent)',
                  fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5,
                }}>
                  <strong style={{ color: 'var(--accent)' }}>💡</strong>{' '}
                  Sube tus fotos aquí y envía la solicitud. Recibimos todo junto y te contactamos por WhatsApp con la oferta.
                </div>

                {error && (
                  <div style={{ padding: '11px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #F2BFBF', fontSize: 13, color: '#A23030' }}>
                    {error} <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ color: '#A23030', fontWeight: 700 }}>Escríbenos →</a>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || sending}
                  className="btn btn-primary"
                  style={{
                    alignSelf: 'stretch',
                    padding: '13px 28px',
                    fontSize: 15,
                    opacity: (canSubmit && !sending) ? 1 : 0.45,
                    cursor: (canSubmit && !sending) ? 'pointer' : 'not-allowed',
                  }}
                >
                  {sending ? 'Enviando…' : 'Enviar cotización →'}
                </button>
              </div>
            ) : (
              <div style={{
                background: 'var(--paper)', border: '1px solid var(--line)',
                borderRadius: 16, padding: '48px 28px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
                  ¡Solicitud enviada!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.6 }}>
                  Recibimos tus datos y fotos. Revisamos tu colección y te contactamos por WhatsApp con la oferta.
                </p>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px' }}>
                  Te respondemos en las próximas 24 horas hábiles.
                </p>
                <button onClick={() => { setSent(false); setName(''); setPhone(''); setDescription(''); setPayment(''); setPhotos([]); setPreviews([]) }} className="btn btn-secondary">
                  Nueva solicitud
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
