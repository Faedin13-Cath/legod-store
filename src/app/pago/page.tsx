'use client'

/**
 * Datos para pagar por transferencia.
 *
 * La mayoría de las ventas se cierran por WhatsApp y el cliente paga por SPEI
 * desde su celular, así que lo único que importa aquí es que la CLABE se copie
 * de un toque y sin errores: teclear 18 dígitos a mano es donde se equivocan.
 */

import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'

// Cuenta a la que se reciben las transferencias.
const CUENTA = {
  clabe:  '722969013023953922',
  nombre: 'Isaac Ramirez',
  banco:  'Mercado Pago W',
}

const PASOS = [
  <>Toca <b>Copiar CLABE</b>.</>,
  <>Abre la app de tu banco y elige <b>Transferir</b>.</>,
  <>Pega la CLABE y envía el pago.</>,
  <>Mándanos tu <b>comprobante</b> por WhatsApp.</>,
]

/**
 * Copiado de respaldo con `execCommand`, que está obsoleto pero sigue siendo
 * lo único que funciona dentro de los navegadores de WhatsApp e Instagram.
 * El `setSelectionRange` es necesario en iPhone.
 */
function copiaALaAntigua(texto: string): boolean {
  const caja = document.createElement('textarea')
  caja.value = texto
  caja.setAttribute('readonly', '')
  caja.style.position = 'fixed'
  caja.style.top = '0'
  caja.style.opacity = '0'
  document.body.appendChild(caja)
  caja.focus()
  caja.select()
  caja.setSelectionRange(0, texto.length)
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  document.body.removeChild(caja)
  return ok
}

/** La CLABE en bloques de 4: así se revisa de un vistazo contra la app del banco. */
function enBloques(clabe: string) {
  return clabe.replace(/(\d{4})(?=\d)/g, '$1 ')
}

export default function PagoPage() {
  const [copiado, setCopiado] = useState<'clabe' | 'nombre' | null>(null)
  const [aviso, setAviso] = useState('')

  /**
   * El portapapeles moderno está bloqueado dentro del navegador de WhatsApp y
   * de Instagram, que es justo por donde llega la mayoría. Cuando falla se
   * intenta la forma vieja, que ahí sí funciona.
   */
  async function copiar(texto: string, cual: 'clabe' | 'nombre') {
    setAviso('')

    let ok = false
    try {
      await navigator.clipboard.writeText(texto)
      ok = true
    } catch {
      ok = copiaALaAntigua(texto)
    }

    if (ok) {
      setCopiado(cual)
      setTimeout(() => setCopiado(c => (c === cual ? null : c)), 2500)
    } else {
      setAviso('Tu navegador no dejó copiar. Mantén presionada la CLABE y elige "Copiar".')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 20px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', margin: '0 0 10px' }}>
            Datos de pago
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
            Transferencia SPEI desde la app de tu banco.
          </p>
        </div>

        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 20, padding: '26px 22px',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8,
          }}>
            CLABE
          </div>

          <div
            style={{
              fontSize: 22, fontWeight: 700, color: 'var(--ink)',
              letterSpacing: '0.02em', textAlign: 'center',
              background: 'var(--cream)', border: '1px dashed var(--line)',
              borderRadius: 12, padding: '14px 10px', userSelect: 'all',
              overflowWrap: 'anywhere',
            }}
          >
            {enBloques(CUENTA.clabe)}
          </div>

          <button
            type="button" onClick={() => copiar(CUENTA.clabe, 'clabe')}
            className="btn btn-primary"
            style={{ width: '100%', minHeight: 52, fontSize: 16, marginTop: 14, gap: 8 }}
          >
            <Icon name={copiado === 'clabe' ? 'check' : 'copy'} size={18} />
            {copiado === 'clabe' ? '¡CLABE copiada!' : 'Copiar CLABE'}
          </button>

          {copiado === 'clabe' && (
            <p role="status" style={{ fontSize: 14, color: 'var(--success)', textAlign: 'center', margin: '10px 0 0' }}>
              Ahora pégala en la app de tu banco.
            </p>
          )}
          {aviso && (
            <p role="status" style={{ fontSize: 14, color: 'var(--ink-2)', margin: '10px 0 0', lineHeight: 1.5 }}>
              {aviso}
            </p>
          )}

          <div style={{ height: 1, background: 'var(--line)', margin: '22px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3,
              }}>
                Nombre
              </div>
              <div style={{ fontSize: 17, fontWeight: 650, color: 'var(--ink)' }}>{CUENTA.nombre}</div>
            </div>
            <button
              type="button" onClick={() => copiar(CUENTA.nombre, 'nombre')}
              className="btn btn-secondary"
              style={{ minHeight: 44, fontSize: 13, gap: 6, flexShrink: 0 }}
            >
              <Icon name={copiado === 'nombre' ? 'check' : 'copy'} size={15} />
              {copiado === 'nombre' ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 3,
            }}>
              Banco
            </div>
            <div style={{ fontSize: 17, fontWeight: 650, color: 'var(--ink)' }}>{CUENTA.banco}</div>
          </div>
        </div>

        <ol style={{ listStyle: 'none', padding: 0, margin: '28px 0 0' }}>
          {PASOS.map((paso, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.4 }}>
              <span style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: 9,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14,
              }}>{i + 1}</span>
              <span>{paso}</span>
            </li>
          ))}
        </ol>

        <a
          href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"
          className="btn btn-secondary"
          style={{ width: '100%', minHeight: 48, fontSize: 15, marginTop: 20, gap: 8, textDecoration: 'none' }}
        >
          <Icon name="whatsapp" size={18} /> Mandar mi comprobante
        </a>

        <p style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', margin: '24px 0 0' }}>
          ¿Dudas? <Link href="/contacto" style={{ color: 'var(--accent)', fontWeight: 500 }}>Escríbenos</Link>.
        </p>
      </div>
    </div>
  )
}
