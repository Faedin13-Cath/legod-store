'use client'

/**
 * ███ MAQUETA DESECHABLE ███
 *
 * El problema real que las referencias no resuelven: una tienda tiene que
 * MOSTRAR productos, no solo verse bonita. Aquí la propuesta es que la rejilla
 * deje de ser uniforme sin dejar de ser escaneable:
 *
 *  - Los filtros son pastillas de color, no un menú lateral gris.
 *  - Las fichas tienen tres tamaños y algunas traen fondo de color, así la
 *    vista respira y no parece hoja de cálculo.
 *  - El precio vive en una etiqueta encimada, no en una línea más de texto.
 *
 * Productos y fotos: reales, de la tienda.
 */

import { useState } from 'react'
import Image from 'next/image'

const MORADO = '#5526AD'
const MORADO_BRILLANTE = '#6050DC'
const DORADO = '#E2A91A'
const TINTA = '#1A1E5A'
const CREMA = '#F5F3EF'

type Figura = { t: string; p: number; img: string; tema: string; estado?: string }

const FIGURAS: Figura[] = [
  { t: 'Darth Maul, brazos rojos impresos', p: 900, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sw0384.png?v=1791321948', tema: 'Star Wars' },
  { t: 'Taskmaster, capa y capucha blancas', p: 300, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0100.png?v=1787789994', tema: 'Marvel' },
  { t: 'Iron Man, armadura Mark 6', p: 250, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0015.png?v=1790042228', tema: 'Marvel', estado: 'Nuevo' },
  { t: 'Doctor Strange, capa de hule', p: 100, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0802.png?v=1790042258', tema: 'Marvel' },
  { t: 'Venom con bufanda y hot dog', p: 120, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-6.png?v=1790042311', tema: 'Marvel' },
  { t: 'Miles Morales con audífonos', p: 150, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-14.png?v=1790042310', tema: 'Marvel', estado: 'Nuevo' },
  { t: 'Storm, Marvel Studios Serie 2', p: 120, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/colmar23_15fdb798-3efd-4616-b05f-6daa243270eb.png?v=1791134171', tema: 'Marvel', estado: 'Sin accesorios' },
  { t: 'Hawkeye, traje blanco', p: 110, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0570_04ffa12e-764c-4fd7-8ef0-a564a51a5e30.png?v=1787196888', tema: 'Marvel' },
  { t: 'Ant-Man, traje blanco', p: 100, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0563_fa945662-9cbc-4648-8dbd-27d966f745df.png?v=1787196887', tema: 'Marvel' },
  { t: 'War Machine, traje blanco', p: 90, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0564_9d69588c-2f04-4c84-89c8-834a40ebb76a.png?v=1787196888', tema: 'Marvel' },
  { t: 'Nebula, traje blanco', p: 80, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0574_012ffa38-72f2-4405-b598-fb2d9af4b905.png?v=1787196887', tema: 'Marvel' },
  { t: 'Loki, capa de tela', p: 180, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0802.png?v=1790042258', tema: 'Marvel' },
]

const FILTROS = [
  { n: 'Todas',      bg: TINTA,   fg: '#fff' },
  { n: 'Star Wars',  bg: '#1A1E5A', fg: '#fff' },
  { n: 'Marvel',     bg: '#D92B3A', fg: '#fff' },
  { n: 'DC',         bg: '#1763D1', fg: '#fff' },
  { n: 'Customs',    bg: MORADO,  fg: '#fff' },
  { n: 'Menos de $150', bg: DORADO, fg: TINTA },
]

const precio = (n: number) => '$' + n.toLocaleString('es-MX')

/** Tres tamaños de ficha para que la rejilla respire sin dejar de escanearse. */
function tamano(i: number): 'grande' | 'color' | 'normal' {
  if (i === 0) return 'grande'
  if (i % 5 === 2) return 'color'
  return 'normal'
}

export default function MockProductos() {
  const [activo, setActivo] = useState('Todas')
  const lista = activo === 'Todas'
    ? FIGURAS
    : activo === 'Menos de $150'
      ? FIGURAS.filter(f => f.p < 150)
      : FIGURAS.filter(f => f.tema === activo)

  return (
    <div style={{ background: CREMA, minHeight: '100dvh' }}>
      <style>{`
        .mp h1, .mp h2 { letter-spacing: -0.035em; line-height: .94; margin: 0; }
        .mp-rejilla {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 16px; grid-auto-flow: dense;
        }
        .mp-grande { grid-column: span 2; grid-row: span 2; }
        .mp-ficha { transition: transform .18s cubic-bezier(.16,1,.3,1); }
        .mp-pill  { transition: transform .15s, box-shadow .15s; }
        @media (hover: hover) {
          .mp-ficha:hover { transform: translateY(-6px) rotate(-.8deg); }
          .mp-pill:hover  { transform: translateY(-2px); }
        }
        .mp-ficha:active { transform: scale(.985); }
        @media (prefers-reduced-motion: reduce) {
          .mp-ficha, .mp-pill { transition: none !important; transform: none !important; }
        }
        @media (max-width: 1100px) { .mp-rejilla { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 820px)  {
          .mp-rejilla { grid-template-columns: repeat(2, 1fr); }
          .mp-grande  { grid-column: span 2; grid-row: span 1; }
        }
      `}</style>

      <div style={{
        background: TINTA, color: '#fff', textAlign: 'center',
        padding: '8px 16px', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em',
      }}>
        Maqueta desechable. No es la tienda real.
      </div>

      <div className="mp">
        {/* Encabezado corto: en una tienda la gente viene a ver, no a leer */}
        <div style={{ padding: 'clamp(30px, 4vw, 52px) clamp(18px, 4vw, 48px) 0' }}>
          <h1 style={{ fontSize: 'clamp(34px, 5.4vw, 66px)', fontWeight: 800, color: TINTA }}>
            La tienda
          </h1>
          <p style={{ fontSize: 16, color: '#4F5180', margin: '12px 0 0', fontWeight: 600 }}>
            {lista.length} figuras disponibles
          </p>
        </div>

        {/* Filtros como pastillas de color, pegados al desplazar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 5, background: CREMA,
          padding: 'clamp(16px, 2.4vw, 26px) clamp(18px, 4vw, 48px)',
        }}>
          <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4 }}>
            {FILTROS.map(f => {
              const on = activo === f.n
              return (
                <button key={f.n} type="button" onClick={() => setActivo(f.n)} className="mp-pill"
                  style={{
                    flex: '0 0 auto', border: on ? 'none' : '2px solid #DCD9D1',
                    background: on ? f.bg : 'transparent',
                    color: on ? f.fg : TINTA,
                    borderRadius: 999, padding: on ? '12px 22px' : '10px 20px',
                    fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', minHeight: 44, whiteSpace: 'nowrap',
                  }}>
                  {f.n}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '6px clamp(18px, 4vw, 48px) 90px' }}>
          {lista.length === 0 ? (
            <div style={{
              background: '#fff', border: '2px dashed #DCD9D1', borderRadius: 24,
              padding: '60px 24px', textAlign: 'center', color: TINTA,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Nada por aquí todavía</div>
              <p style={{ color: '#4F5180', margin: '0 0 18px' }}>Prueba con otro filtro, o escríbenos y la conseguimos.</p>
              <button type="button" onClick={() => setActivo('Todas')} className="mp-pill" style={{
                background: TINTA, color: '#fff', border: 'none', borderRadius: 999,
                padding: '13px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', minHeight: 44,
              }}>Ver todas</button>
            </div>
          ) : (
            <div className="mp-rejilla">
              {lista.map((f, i) => {
                const forma = tamano(i)
                const esColor = forma === 'color'
                const esGrande = forma === 'grande'
                return (
                  <article key={f.t + i} className={`mp-ficha${esGrande ? ' mp-grande' : ''}`} style={{
                    position: 'relative', borderRadius: 24, padding: 14,
                    background: esColor ? MORADO_BRILLANTE : '#fff',
                    color: esColor ? '#fff' : TINTA,
                    border: esColor ? 'none' : '1px solid #E6E4DD',
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {f.estado && (
                      <span style={{
                        position: 'absolute', top: 20, left: 20, zIndex: 2,
                        background: esColor ? '#fff' : TINTA, color: esColor ? TINTA : '#fff',
                        borderRadius: 999, padding: '5px 12px', fontSize: 11.5, fontWeight: 800,
                      }}>{f.estado}</span>
                    )}

                    <div style={{
                      background: esColor ? '#ffffff1f' : CREMA, borderRadius: 16,
                      flex: 1, minHeight: esGrande ? 300 : 188,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                    }}>
                      <Image src={f.img} alt={f.t} width={520} height={520}
                        priority={i === 0}
                        style={{ width: esGrande ? '58%' : '76%', height: 'auto', objectFit: 'contain' }} />
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10,
                    }}>
                      <div style={{
                        fontSize: esGrande ? 19 : 14.5, fontWeight: 700,
                        lineHeight: 1.25, flex: 1, minWidth: 0,
                      }}>{f.t}</div>
                      <div style={{
                        background: esColor ? '#fff' : DORADO, color: TINTA,
                        borderRadius: 999, padding: esGrande ? '9px 18px' : '7px 14px',
                        fontSize: esGrande ? 20 : 16, fontWeight: 800, whiteSpace: 'nowrap',
                      }}>{precio(f.p)}</div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
