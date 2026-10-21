'use client'

/**
 * Datos para pagar por transferencia.
 *
 * La mayoría de las ventas se cierran por WhatsApp y el cliente paga por SPEI
 * desde su celular, así que lo único que importa es que la CLABE se copie de un
 * toque: teclear 18 dígitos a mano es donde se equivocan.
 *
 * El aspecto es el de un ladrillo LEGO a propósito — es una tienda de LEGO y
 * esta página se abre fuera del resto del sitio, casi siempre desde un enlace
 * de WhatsApp.
 */

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

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
 * Copiado de respaldo con `execCommand`, obsoleto pero lo único que funciona
 * dentro de los navegadores de WhatsApp e Instagram, que es por donde llega
 * la mayoría. El `setSelectionRange` hace falta en iPhone.
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

export default function PagoPage() {
  const [copiado, setCopiado] = useState<'clabe' | 'nombre' | null>(null)
  const [aviso, setAviso] = useState('')
  const clabeRef = useRef<HTMLDivElement>(null)

  // Los 18 dígitos deben caber en una sola línea en cualquier pantalla.
  useEffect(() => {
    function ajustar() {
      const el = clabeRef.current
      if (!el) return
      let tam = 27
      el.style.fontSize = tam + 'px'
      while (el.scrollWidth > el.clientWidth && tam > 12) {
        tam -= 1
        el.style.fontSize = tam + 'px'
      }
    }
    ajustar()
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [])

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
      if (cual === 'clabe') setAviso('Ahora pégala en la app de tu banco')
    } else {
      // Sin portapapeles le queda seleccionarla a mano: no se le deja sin salida.
      const el = clabeRef.current
      if (el) {
        const r = document.createRange()
        r.selectNodeContents(el)
        const s = window.getSelection()
        s?.removeAllRanges()
        s?.addRange(r)
      }
      setAviso('Mantén presionada la CLABE y elige "Copiar"')
    }
  }

  const copiadaClabe = copiado === 'clabe'

  return (
    <div className="pago-fondo">
      <style>{`
        .pago-fondo {
          min-height: 100vh;
          padding: 62px 12px 28px;
          background:
            radial-gradient(circle at 50% 40%, rgba(255,255,255,0.10) 0 9px, rgba(255,255,255,0) 10px) 0 0 / 34px 34px,
            radial-gradient(ellipse at 50% 0%, #6453dd 0%, #4c0082 45%, #1a0533 100%);
          font-family: -apple-system, "Helvetica Neue", Arial, sans-serif;
        }
        .pago-tarjeta {
          position: relative; max-width: 430px; margin: 0 auto;
          background: #fff; border-radius: 26px;
          box-shadow: 0 18px 50px rgba(0,0,0,0.45);
        }
        .pago-logo {
          position: absolute; top: -50px; left: 50%; transform: translateX(-50%);
          width: 100px; height: 100px; border-radius: 50%; background: #fff;
          box-shadow: 0 0 0 6px #fff, 0 10px 24px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pago-encabezado {
          border-radius: 26px 26px 0 0; color: #fff; text-align: center;
          padding: 60px 18px 18px;
          background: linear-gradient(135deg, #6453dd 0%, #6453dd 55%, #4c0082 100%);
        }
        .pago-chip {
          display: inline-block; margin-top: 12px; padding: 5px 14px; border-radius: 30px;
          background: #ffd84a; color: #1a0533; font-size: 13px; font-weight: 900; letter-spacing: 0.5px;
        }
        .pago-clabe {
          font-weight: 900; letter-spacing: 0.5px; text-align: center;
          white-space: nowrap; overflow: hidden; color: #1a0533;
          background: #f4f2ff; border: 2px dashed #6453dd; border-radius: 14px;
          padding: 12px 8px; margin-top: 6px; user-select: all; -webkit-user-select: all;
        }
        /* Botón con forma de ladrillo: pernos arriba y la sombra que lo levanta. */
        .pago-ladrillo {
          position: relative; width: 100%; margin-top: 24px; padding: 18px;
          font-size: 21px; font-weight: 900; color: #fff; letter-spacing: 0.5px;
          background: #6453dd; border: none; border-radius: 10px; cursor: pointer;
          font-family: inherit; -webkit-tap-highlight-color: transparent;
          box-shadow: 0 7px 0 #4c0082, 0 12px 20px rgba(76,0,130,0.35);
          transition: transform .08s, box-shadow .08s, background .25s;
        }
        .pago-ladrillo:active { transform: translateY(5px); box-shadow: 0 2px 0 #4c0082, 0 4px 8px rgba(76,0,130,0.3); }
        .pago-ladrillo.ok { background: #17a34a; box-shadow: 0 7px 0 #0f7a36, 0 12px 20px rgba(23,163,74,0.35); }
        /* Los pernos del ladrillo, como elementos de verdad: un pseudo-elemento
           aquí no se pinta de forma confiable y esto además se sigue mejor. */
        .pago-pernos {
          position: absolute; top: -11px; left: 10%; right: 10%; height: 12px;
          display: flex; justify-content: space-between; pointer-events: none;
        }
        .pago-pernos span {
          width: 16%; background: #6453dd; border-radius: 6px 6px 0 0;
          transition: background .25s;
        }
        .pago-ladrillo.ok .pago-pernos span { background: #17a34a; }
        .pago-mini {
          padding: 9px 14px; font-size: 14px; font-weight: 900; border-radius: 10px;
          color: #6453dd; background: #f4f2ff; border: 2px solid #6453dd;
          white-space: nowrap; cursor: pointer; font-family: inherit;
          -webkit-tap-highlight-color: transparent; min-height: 44px;
        }
        .pago-mini.ok { color: #17a34a; border-color: #17a34a; background: #eafbf0; }
        .pago-aviso {
          min-height: 22px; margin-top: 14px; text-align: center;
          font-size: 15px; font-weight: 800; color: #17a34a;
        }
        @keyframes pago-pop {
          0% { transform: scale(0.7); opacity: 0; }
          70% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .pago-pop { animation: pago-pop .35s ease-out; }
      `}</style>

      <div className="pago-tarjeta">
        <div className="pago-logo">
          <Image
            src="/assets/logo/legod-logo-violet-128.webp" alt="Jango's Store"
            width={100} height={100} priority style={{ borderRadius: '50%' }}
          />
        </div>

        <div className="pago-encabezado">
          <h1 style={{ fontSize: 27, fontWeight: 900, letterSpacing: 1, margin: 0 }}>DATOS DE PAGO</h1>
          <p style={{ fontSize: 14, opacity: 0.9, margin: '4px 0 0', letterSpacing: 0.5 }}>
            Jango&apos;s Store · Minifiguras LEGO originales
          </p>
          <span className="pago-chip">TRANSFERENCIA SPEI</span>
        </div>

        <div style={{ padding: 18, color: '#1a0533' }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: '#6453dd' }}>CLABE</div>
          <div className="pago-clabe" ref={clabeRef}>{CUENTA.clabe}</div>

          <button
            type="button" onClick={() => copiar(CUENTA.clabe, 'clabe')}
            className={`pago-ladrillo${copiadaClabe ? ' ok' : ''}`}
          >
            <span className="pago-pernos" aria-hidden="true">
              <span /><span /><span /><span />
            </span>
            {copiadaClabe ? '✓ ¡CLABE copiada!' : 'Copiar CLABE'}
          </button>

          <div
            key={aviso} role="status"
            className={`pago-aviso${aviso ? ' pago-pop' : ''}`}
            style={{ color: copiadaClabe ? '#17a34a' : '#4c0082' }}
          >
            {aviso}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: '#6453dd' }}>NOMBRE</div>
              <div style={{ fontSize: 21, fontWeight: 800, marginTop: 3 }}>{CUENTA.nombre}</div>
            </div>
            <button
              type="button" onClick={() => copiar(CUENTA.nombre, 'nombre')}
              className={`pago-mini${copiado === 'nombre' ? ' ok' : ''}`}
            >
              {copiado === 'nombre' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, color: '#6453dd' }}>BANCO</div>
            <div style={{ fontSize: 21, fontWeight: 800, marginTop: 3 }}>{CUENTA.banco}</div>
          </div>

          <div style={{ height: 1, background: '#ece8ff', margin: '4px 0 20px' }} />

          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {PASOS.map((paso, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, lineHeight: 1.3, padding: '5px 0' }}>
                <span style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                  background: '#ffd84a', color: '#1a0533', fontWeight: 900, fontSize: 15,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 3px 0 #c9a300',
                }}>{i + 1}</span>
                <span>{paso}</span>
              </li>
            ))}
          </ol>

          <a
            href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 20, minHeight: 48, borderRadius: 10, textDecoration: 'none',
              background: '#f4f2ff', border: '2px solid #6453dd', color: '#4c0082',
              fontSize: 15, fontWeight: 900,
            }}
          >
            Mandar mi comprobante
          </a>
        </div>
      </div>

      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 12 }}>
        ¡Gracias por tu compra! 🧱
      </p>
    </div>
  )
}
