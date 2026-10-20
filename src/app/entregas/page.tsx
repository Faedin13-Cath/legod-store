'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import { CARRIERS_ENVIO, SHIPPING_PRICES } from '@/lib/shipping'
import { normalizarTelefono, validarResta, type ContactoEnmascarado } from '@/lib/entregas'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'
const MAX_FOTO = 10 * 1024 * 1024
const MAX_PIEZAS = 5000

type Fase = 'telefono' | 'conocido' | 'nuevo'
type Tipo = 'envio' | 'rock_show'
type Pago = 'pagado' | 'falta'

// Lo que se ve en cada paquetería. FedEx no tiene precio fijo aquí: se cotiza.
const etiquetaCarrier = (c: string) =>
  c === 'FedEx' ? 'FedEx (a cotizar)' : `${c} $${SHIPPING_PRICES[c]}`

const DIR_VACIA = {
  recibe: '', calle: '', numExt: '', numInt: '', cp: '',
  colonia: '', ciudad: '', estado: '', referencia: '',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
}
// 16px evita que el iPhone haga zoom al tocar un campo.
const inputStyle: React.CSSProperties = { width: '100%', fontSize: 16, minHeight: 46 }

function Campo({ label, opcional, children }: { label: string; opcional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {opcional && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}> (opcional)</span>}
      </label>
      {children}
    </div>
  )
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={{
      background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
      padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#DC2626', lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

/** Opción grande y tocable (envío / Rock Show, pagado / me falta). */
function Opcion({ activa, onClick, titulo, detalle, icono }: {
  activa: boolean; onClick: () => void; titulo: string; detalle?: string; icono?: string
}) {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={activa}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
        minHeight: 64, padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
        background: activa ? 'var(--accent-soft)' : 'var(--paper)',
        border: `2px solid ${activa ? 'var(--accent)' : 'var(--line)'}`,
        color: 'var(--ink)', fontFamily: 'inherit',
      }}
    >
      {icono && <span style={{ color: activa ? 'var(--accent)' : 'var(--ink-3)', display: 'flex' }}><Icon name={icono} size={24} /></span>}
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 16, fontWeight: 600 }}>{titulo}</span>
        {detalle && <span style={{ display: 'block', fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>{detalle}</span>}
      </span>
      {activa && <span style={{ color: 'var(--accent)', display: 'flex' }}><Icon name="check" size={20} /></span>}
    </button>
  )
}

export default function EntregasPage() {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1)
  const [fase, setFase] = useState<Fase>('telefono')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const enviando = useRef(false) // un doble toque llega antes de que React repinte el botón

  // Paso 1
  const [telefono, setTelefono] = useState('')
  const [contacto, setContacto] = useState<ContactoEnmascarado | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [cambiarDir, setCambiarDir] = useState(false)
  // Celular que el cliente dijo "no soy yo": si vuelve a salir el mismo, no es un dedazo.
  const [rechazado, setRechazado] = useState('')
  const [noSoyYo, setNoSoyYo] = useState(false)
  // El servidor no encontró su registro de entregas (p. ej. solo tiene cuenta en la tienda).
  const [pedirNombre, setPedirNombre] = useState(false)

  // Paso 2
  const [tipo, setTipo] = useState<Tipo | ''>('')
  const [paqueteria, setPaqueteria] = useState('')
  const [dir, setDir] = useState(DIR_VACIA)

  // Paso 3
  const [piezas, setPiezas] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [pago, setPago] = useState<Pago | ''>('')
  const [monto, setMonto] = useState('')

  const [fotoFallo, setFotoFallo] = useState(false)

  const setD = (k: keyof typeof DIR_VACIA) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDir(d => ({ ...d, [k]: e.target.value }))

  // El aviso está arriba: en el paso 3 hay que subir para que se vea.
  const falla = (m: string) => { setError(m); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const irA = (p: 1 | 2 | 3 | 4) => {
    setError(''); setPaso(p)
    window.scrollTo({ top: 0 })
  }

  // ── Paso 1 ──
  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const tel = normalizarTelefono(telefono)
    if (!tel) { falla('Escribe tu celular a 10 dígitos, por ejemplo 55 1234 5678.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/entregas/buscar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono }),
      })
      if (res.status === 400) { falla('Ese celular no parece válido. Revisa que sean 10 dígitos.'); return }
      if (res.status === 429) { falla('Has intentado muchas veces. Espera un minuto y vuelve a intentar.'); return }
      if (!res.ok) { falla('No pudimos revisar tu número. Intenta de nuevo en un momento.'); return }
      const data = await res.json() as { contacto: ContactoEnmascarado | null }
      if (data.contacto && tel !== rechazado) {
        // El nombre no se guarda aquí: buscar solo da el de pila y el guardado no se debe pisar.
        setContacto(data.contacto); setNombre('')
        setFase('conocido')
      } else {
        // Nuevo, o dijo "no soy yo" y el número volvió a salir: es suyo y lo confirma.
        setContacto(null); setNombre(''); setNoSoyYo(Boolean(data.contacto))
        setFase('nuevo')
      }
    } catch {
      falla('No hay conexión. Revisa tu internet e intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  function esOtraPersona() {
    // Lo más probable es un dígito mal puesto: se regresa al celular para corregirlo.
    setRechazado(normalizarTelefono(telefono) ?? '')
    setContacto(null); setNombre(''); setEmail(''); setCambiarDir(false); setNoSoyYo(false); setPedirNombre(false)
    setFase('telefono'); setError('')
  }

  function cambiarNumero() {
    setContacto(null); setNombre(''); setEmail(''); setCambiarDir(false); setNoSoyYo(false); setPedirNombre(false)
    setFase('telefono'); setError('')
  }

  function continuarPaso1(conCambioDir: boolean) {
    setError('')
    if (fase === 'nuevo' && !nombre.trim()) { falla('Escribe tu nombre.'); return }
    if (fase === 'nuevo' && email.trim() && !/^[^\s@]+@[^\s@]+$/.test(email.trim())) {
      falla('Ese correo no parece válido. Revísalo o déjalo en blanco.'); return
    }
    setCambiarDir(conCambioDir)
    irA(2)
  }

  // ── Paso 2 ──
  function continuarPaso2() {
    setError('')
    if (!tipo) { falla('Elige si es envío o Rock Show.'); return }
    if (tipo === 'envio') {
      if (!paqueteria) { falla('Elige la paquetería.'); return }
      if (usaGuardada) { irA(3); return }
      const faltan = (['recibe', 'calle', 'numExt', 'cp', 'colonia', 'ciudad', 'estado', 'referencia'] as const)
        .some(k => !dir[k].trim())
      if (faltan) { falla('Faltan datos de la dirección. Solo el número interior es opcional.'); return }
      if (!/^\d{5}$/.test(dir.cp.trim())) { falla('El código postal son 5 números.'); return }
    }
    irA(3)
  }

  // ── Paso 3 ──
  function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) { falla('La foto debe ser una imagen.'); return }
    if (f.size > MAX_FOTO) { falla('La foto pesa más de 10 MB. Elige una más ligera.'); return }
    setError(''); setFoto(f)
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando.current) return
    setError('')
    if (!piezas.trim()) { falla('Escribe las piezas, una por renglón.'); return }
    if (piezas.length > MAX_PIEZAS) { falla('La lista es demasiado larga (máximo 5000 caracteres).'); return }
    if (!pago) { falla('Dinos si ya está todo pagado o cuánto te falta.'); return }
    let resta = '0'
    if (pago === 'falta') {
      const n = validarResta(monto)
      if (n === null || n <= 0) { falla('Escribe cuánto te falta pagar, solo el número. Ejemplo: 350'); return }
      resta = String(n)
    }

    const fd = new FormData()
    fd.set('telefono', telefono)
    if (nombre.trim()) fd.set('nombre', nombre.trim()) // solo cliente nuevo o "no soy yo"
    if (email.trim()) fd.set('email', email.trim())
    if (noSoyYo) fd.set('noSoyYo', 'true')
    fd.set('tipo', tipo)
    if (tipo === 'envio') {
      fd.set('paqueteria', paqueteria)
      if (usaGuardada) fd.set('usarGuardada', 'true')
      else for (const [k, v] of Object.entries(dir)) fd.set(k, v.trim())
    }
    fd.set('piezas', piezas)
    fd.set('resta', resta)
    if (foto) fd.set('foto', foto)

    enviando.current = true
    setBusy(true)
    try {
      const res = await fetch('/api/entregas', { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; fotoFallo?: boolean; error?: string; codigo?: string }
      if (data.codigo === 'sin_direccion_guardada') {
        // No había dirección que reutilizar: se piden los campos, lo demás se conserva.
        setContacto(c => c && { ...c, tieneDireccion: false })
        irA(2); falla('No tenemos tu dirección guardada completa. Escríbela para continuar.')
        return
      }
      if (data.codigo === 'falta_nombre') {
        setPedirNombre(true); setFase('nuevo')
        irA(1); falla('Necesitamos tu nombre completo para guardar tu entrega.')
        return
      }
      if (!res.ok || !data.ok) {
        falla(data.error ?? 'No se pudo guardar. Intenta de nuevo en un momento.')
        return
      }
      setFotoFallo(Boolean(data.fotoFallo))
      irA(4)
    } catch {
      falla('No hay conexión. Revisa tu internet e intenta de nuevo; tus datos siguen aquí.')
    } finally {
      enviando.current = false
      setBusy(false)
    }
  }

  // Cliente reconocido que eligió Continuar: la dirección se toma de lo guardado, no se escribe.
  const usaGuardada = Boolean(contacto?.tieneDireccion) && !cambiarDir

  const lineas = piezas.split('\n').filter(l => l.trim()).length
  const btn: React.CSSProperties = { height: 50, fontSize: 16, width: '100%' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '24px 16px 40px' }}>
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 24, overflow: 'hidden',
      }}>
        {/* Encabezado */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--line)' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/assets/logo/legod-logo-violet-128.webp" alt="LEGOD" width={36} height={36} style={{ borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>Jango&apos;s Store</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Datos de tu entrega</div>
            </div>
          </Link>

          {paso < 4 && (
            <div style={{ marginTop: 16 }} aria-label={`Paso ${paso} de 3`}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3].map(n => (
                  <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= paso ? 'var(--accent)' : 'var(--line)' }} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, fontWeight: 500 }}>
                Paso {paso} de 3 · {['Tu celular', 'Envío o Rock Show', 'Tus piezas'][paso - 1]}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '22px 20px 24px' }}>
          {error && <Aviso>{error}</Aviso>}

          {/* ───────── Paso 1: celular ───────── */}
          {paso === 1 && fase === 'telefono' && (
            <form onSubmit={buscar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>¿Cuál es tu celular?</h1>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
                  {rechazado
                    ? 'Revisa que esté bien escrito, a 10 dígitos.'
                    : 'Con él te reconocemos y no tienes que escribir todo otra vez.'}
                </p>
              </div>
              <input
                type="tel" inputMode="tel" autoComplete="tel" autoFocus
                value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="55 1234 5678" aria-label="Celular"
                className="input" style={{ ...inputStyle, fontSize: 22, minHeight: 60, textAlign: 'center', letterSpacing: '0.04em' }}
              />
              <button type="submit" disabled={busy} className="btn btn-primary" style={btn}>
                {busy ? 'Buscando…' : 'Continuar'}
              </button>
            </form>
          )}

          {paso === 1 && fase === 'conocido' && contacto && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>¡Hola, {contacto.nombre}! 👋</h1>
              <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 16, padding: '14px 16px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Lo que tenemos guardado</div>
                <div><strong style={{ color: 'var(--ink)' }}>Celular:</strong> {telefono}</div>
                {contacto.email && <div><strong style={{ color: 'var(--ink)' }}>Correo:</strong> {contacto.email}</div>}
                {contacto.tieneDireccion && (
                  <>
                    <div><strong style={{ color: 'var(--ink)' }}>Calle:</strong> {contacto.calle}</div>
                    <div><strong style={{ color: 'var(--ink)' }}>Colonia:</strong> {contacto.colonia}</div>
                    <div><strong style={{ color: 'var(--ink)' }}>C.P.:</strong> {contacto.cp}</div>
                  </>
                )}
              </div>
              <button type="button" onClick={() => continuarPaso1(false)} className="btn btn-primary" style={btn}>
                {contacto.tieneDireccion ? 'Continuar, a la misma dirección' : 'Continuar'}
              </button>
              {contacto.tieneDireccion && (
                <button type="button" onClick={() => continuarPaso1(true)} className="btn btn-secondary" style={btn}>Cambiar dirección</button>
              )}
              <button
                type="button" onClick={esOtraPersona} className="btn btn-secondary"
                style={{ ...btn, color: '#DC2626', borderColor: '#FCA5A5', background: '#FEF2F2' }}
              >
                No soy yo
              </button>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5, textAlign: 'center' }}>
                ¿Esos no son tus datos? Toca <strong>No soy yo</strong> y revisa tu número.
              </p>
            </div>
          )}

          {paso === 1 && fase === 'nuevo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
                  {pedirNombre ? '¿Cómo te llamas?' : noSoyYo ? 'Cuéntanos quién eres' : '¡Bienvenido! Es tu primera vez'}
                </h1>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
                  {pedirNombre
                    ? 'Escribe tu nombre completo y seguimos donde te quedaste.'
                    : noSoyYo
                    ? 'Ese celular ya está guardado a nombre de otra persona. Escribe tus datos y lo revisamos contigo por WhatsApp.'
                    : 'Solo necesitamos un par de datos.'}
                </p>
              </div>
              <Campo label="Celular">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 600 }}>{telefono}</div>
                  <button type="button" onClick={cambiarNumero} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 8 }}>
                    Cambiar
                  </button>
                </div>
              </Campo>
              <Campo label="Tu nombre completo">
                <input type="text" autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre y apellido" className="input" style={inputStyle} />
              </Campo>
              <Campo label="Correo" opcional>
                <input type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="input" style={inputStyle} />
              </Campo>
              <button type="button" onClick={() => continuarPaso1(true)} className="btn btn-primary" style={btn}>Continuar</button>
            </div>
          )}

          {/* ───────── Paso 2: envío o Rock Show ───────── */}
          {paso === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>¿Cómo recibes tus piezas?</h1>
              <Opcion activa={tipo === 'envio'} onClick={() => setTipo('envio')} icono="truck" titulo="Envío a domicilio" detalle="Te lo mandamos por paquetería" />
              <Opcion activa={tipo === 'rock_show'} onClick={() => setTipo('rock_show')} icono="gift" titulo="Lo recojo en el Rock Show" detalle="No necesitamos tu dirección" />

              {tipo === 'envio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 6 }}>
                  <Campo label="Paquetería">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {CARRIERS_ENVIO.map(c => (
                        <Opcion key={c} activa={paqueteria === c} onClick={() => setPaqueteria(c)} titulo={etiquetaCarrier(c)} />
                      ))}
                    </div>
                  </Campo>

                  {usaGuardada && contacto && (
                    <div style={{ background: 'var(--accent-soft)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                      Lo enviamos a la <strong>misma dirección de siempre</strong>:{' '}
                      <strong style={{ color: 'var(--ink)' }}>{contacto.calle}, col. {contacto.colonia}, C.P. {contacto.cp}</strong>.
                      <br />
                      <button type="button" onClick={() => setCambiarDir(true)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 0 0' }}>
                        Usar otra dirección
                      </button>
                    </div>
                  )}

                  {!usaGuardada && contacto?.tieneDireccion && (
                    <div style={{ background: 'var(--accent-soft)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                      Antes tenías:{' '}
                      <strong style={{ color: 'var(--ink)' }}>{contacto.calle}, col. {contacto.colonia}, C.P. {contacto.cp}</strong>.
                      <br />
                      Escribe aquí tu nueva dirección.
                    </div>
                  )}

                  {!usaGuardada && (
                    <>

                  <Campo label="Quién recibe"><input type="text" value={dir.recibe} onChange={setD('recibe')} autoComplete="name" className="input" style={inputStyle} /></Campo>
                  <Campo label="Calle"><input type="text" value={dir.calle} onChange={setD('calle')} autoComplete="address-line1" className="input" style={inputStyle} /></Campo>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}><Campo label="Núm. exterior"><input type="text" value={dir.numExt} onChange={setD('numExt')} className="input" style={inputStyle} /></Campo></div>
                    <div style={{ flex: 1, minWidth: 0 }}><Campo label="Núm. interior" opcional><input type="text" value={dir.numInt} onChange={setD('numInt')} className="input" style={inputStyle} /></Campo></div>
                  </div>
                  <Campo label="Código postal"><input type="text" inputMode="numeric" maxLength={5} value={dir.cp} onChange={setD('cp')} autoComplete="postal-code" placeholder="5 números" className="input" style={inputStyle} /></Campo>
                  <Campo label="Colonia"><input type="text" value={dir.colonia} onChange={setD('colonia')} className="input" style={inputStyle} /></Campo>
                  <Campo label="Municipio o ciudad"><input type="text" value={dir.ciudad} onChange={setD('ciudad')} autoComplete="address-level2" className="input" style={inputStyle} /></Campo>
                  <Campo label="Estado"><input type="text" value={dir.estado} onChange={setD('estado')} autoComplete="address-level1" className="input" style={inputStyle} /></Campo>
                  <Campo label="Referencia"><input type="text" value={dir.referencia} onChange={setD('referencia')} placeholder="Entre qué calles, color de la casa…" className="input" style={inputStyle} /></Campo>
                    </>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => irA(1)} className="btn btn-secondary" style={{ height: 50, fontSize: 16, flex: '0 0 auto', padding: '0 20px' }}>Atrás</button>
                <button type="button" onClick={continuarPaso2} className="btn btn-primary" style={{ ...btn, flex: 1 }}>Continuar</button>
              </div>
            </div>
          )}

          {/* ───────── Paso 3: piezas y resta ───────── */}
          {paso === 3 && (
            <form onSubmit={enviar} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>¿Qué piezas son?</h1>

              <Campo label="Tus piezas">
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  <strong>Una por renglón.</strong> Escribe el nombre o la clave de cada figura.
                </p>
                <textarea
                  value={piezas} onChange={e => setPiezas(e.target.value)} rows={8}
                  placeholder={'Darth Vader\nSpider-Man\nsw0001'}
                  className="input" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
                <div style={{ fontSize: 12, color: piezas.length > MAX_PIEZAS ? '#DC2626' : 'var(--ink-3)', marginTop: 4 }}>
                  {lineas} {lineas === 1 ? 'pieza' : 'piezas'}
                </div>
              </Campo>

              <Campo label="Foto de lo que te vendimos" opcional>
                {foto ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px' }}>
                    <span style={{ color: 'var(--success)', display: 'flex' }}><Icon name="check" size={18} /></span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{foto.name}</span>
                    <button type="button" onClick={() => setFoto(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 8 }}>Quitar</button>
                  </div>
                ) : (
                  <label className="btn btn-secondary" style={{ ...btn, cursor: 'pointer' }}>
                    <Icon name="plus" size={16} /> Subir o tomar foto
                    <input type="file" accept="image/*" onChange={elegirFoto} style={{ display: 'none' }} />
                  </label>
                )}
              </Campo>

              <Campo label="Pago">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Opcion activa={pago === 'pagado'} onClick={() => setPago('pagado')} titulo="Ya está todo pagado" />
                  <Opcion activa={pago === 'falta'} onClick={() => setPago('falta')} titulo="Me falta pagar" />
                  {pago === 'falta' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>$</span>
                      <input
                        type="text" inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)}
                        placeholder="Cuánto te falta, ej. 350" aria-label="Cantidad que te falta pagar"
                        className="input" style={inputStyle}
                      />
                      <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>MXN</span>
                    </div>
                  )}
                </div>
              </Campo>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => irA(2)} disabled={busy} className="btn btn-secondary" style={{ height: 50, fontSize: 16, flex: '0 0 auto', padding: '0 20px' }}>Atrás</button>
                <button type="submit" disabled={busy} className="btn btn-primary" style={{ ...btn, flex: 1, opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          )}

          {/* ───────── Gracias ───────── */}
          {paso === 4 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--success)',
              }}>
                <Icon name="check" size={26} />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>¡Gracias, {(contacto?.nombre || nombre.trim().split(/\s+/)[0])}!</h1>
              <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
                Ya tenemos los datos de tu entrega. Si hace falta algo más, te escribimos por WhatsApp.
              </p>
              {fotoFallo && (
                <div style={{ marginTop: 18, textAlign: 'left', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#92400E', lineHeight: 1.5 }}>
                  <strong>Tus datos sí llegaron, pero tu foto no se pudo subir.</strong>{' '}
                  Mándala por WhatsApp para que no se pierda:
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ ...btn, marginTop: 10, textDecoration: 'none' }}>
                    <Icon name="whatsapp" size={18} /> Mandar la foto
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
