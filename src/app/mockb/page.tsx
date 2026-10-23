'use client'

/**
 * ███ MAQUETA DESECHABLE · OPCIÓN B: "VITRINA" ███
 *
 * La apuesta: personalidad fuerte arriba, catálogo tranquilo abajo. Es la
 * respuesta a la objeción del dueño sobre Omsom, que se ve increíble y es un
 * lío para comprar.
 *
 * La portada es un bloque de color saturado con las figuras encimadas y
 * desalineadas. En cuanto empieza el catálogo, el ruido se apaga: fondo claro,
 * rejilla pareja, platos idénticos. El color regresa solo en la tira de temas
 * y en los precios, que es donde ayuda a escanear.
 */

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { FIGURAS, precio } from '../mockdatos'

const TEMAS = ['Todas', 'Star Wars', 'Marvel'] as const

export default function MockB() {
  const [tema, setTema] = useState<typeof TEMAS[number]>('Todas')
  const lista = useMemo(
    () => (tema === 'Todas' ? FIGURAS : FIGURAS.filter(f => f.tema === tema)),
    [tema],
  )
  const trio = [FIGURAS[0], FIGURAS[2], FIGURAS[3]]

  return (
    <div className="vi">
      <style>{`
        header, footer { display: none !important; }

        .vi {
          --morado: #4B1FA8;
          --morado2:#6E3CE6;
          --oro:    #F2B021;
          --papel:  #FBFBFC;
          --plato:  #F1F1F4;
          --tinta:  #17171C;
          --gris:   #5C5C66;
          --linea:  #E4E4E9;
          --ease:   cubic-bezier(0.23, 1, 0.32, 1);
          background: var(--papel); color: var(--tinta); min-height: 100dvh;
        }
        .vi h1, .vi h2 { margin: 0; letter-spacing: -0.03em; text-wrap: balance; }

        /* ── Arriba: el bloque con personalidad ── */
        .vi-portada {
          position: relative; overflow: hidden;
          background: var(--morado); color: #fff;
          padding: clamp(26px, 4vw, 48px) clamp(20px, 5vw, 64px) 0;
        }
        /* Franjas diagonales muy suaves: textura, no estampado */
        .vi-portada::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(115deg,
            rgba(255,255,255,.05) 0 2px, rgba(255,255,255,0) 2px 26px);
        }
        .vi-interior { position: relative; max-width: 1400px; margin: 0 auto; }
        .vi-nav { display: flex; align-items: center; gap: 24px; font-size: 14.5px; color: #D7CBF7; }
        .vi-nav a { color: inherit; text-decoration: none; }

        .vi-escena {
          display: grid; grid-template-columns: 1fr auto; align-items: end;
          gap: clamp(20px, 4vw, 48px); padding: clamp(30px, 5vw, 60px) 0 0;
        }
        /* Las tres figuras encimadas y desalineadas: el guiño a Omsom */
        .vi-trio { display: flex; align-items: flex-end; }
        .vi-trio > div { position: relative; }
        .vi-trio > div + div { margin-left: -9%; }
        .vi-trio img { display: block; height: auto; filter: drop-shadow(0 22px 34px rgba(0,0,0,.42)); }

        .vi-sello {
          position: absolute; top: clamp(4px, 2vw, 18px); right: 0;
          background: var(--oro); color: #17171C; border-radius: 999px;
          padding: 9px 18px; font-size: 14px; font-weight: 800;
          transform: rotate(-3deg);
        }

        .vi-cta {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--oro); color: #17171C; border: none; border-radius: 999px;
          padding: 15px 30px; font-size: 16px; font-weight: 800; font-family: inherit;
          text-decoration: none; cursor: pointer; min-height: 48px;
          transition: transform 140ms var(--ease);
        }

        /* ── Abajo: el catálogo se calla ── */
        .vi-tira {
          display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
          padding: clamp(22px, 3vw, 34px) clamp(20px, 5vw, 64px) 0;
          max-width: 1400px; margin: 0 auto;
        }
        .vi-tira::-webkit-scrollbar { display: none; }
        .vi-chip {
          flex: 0 0 auto; border: 1px solid var(--linea); background: #fff; color: var(--tinta);
          border-radius: 999px; padding: 10px 18px; font-size: 14.5px; font-weight: 600;
          font-family: inherit; cursor: pointer; min-height: 44px; white-space: nowrap;
          transition: background 160ms var(--ease), border-color 160ms var(--ease), color 160ms var(--ease), transform 140ms var(--ease);
        }
        .vi-chip[aria-pressed="true"] { background: var(--morado); border-color: var(--morado); color: #fff; }

        .vi-rejilla {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: clamp(22px, 2.4vw, 34px) clamp(16px, 1.8vw, 24px);
          padding: clamp(24px, 3vw, 38px) clamp(20px, 5vw, 64px) 110px;
          max-width: 1400px; margin: 0 auto;
        }
        .vi-ficha {
          position: relative; display: flex; flex-direction: column;
          text-decoration: none; color: inherit;
          opacity: 0; transform: translateY(8px);
          animation: vi-entra 420ms var(--ease) forwards;
        }
        @keyframes vi-entra { to { opacity: 1; transform: translateY(0); } }

        .vi-plato {
          background: var(--plato); border-radius: 14px; aspect-ratio: 1;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px; overflow: hidden;
        }
        .vi-plato img {
          width: 62%; height: auto; object-fit: contain;
          filter: drop-shadow(0 10px 14px rgba(23,23,28,.15));
          transition: transform 260ms var(--ease);
        }
        .vi-nota {
          position: absolute; top: 10px; left: 10px; z-index: 2;
          background: var(--morado2); color: #fff; border-radius: 999px;
          padding: 4px 10px; font-size: 11px; font-weight: 800;
        }

        @media (hover: hover) and (pointer: fine) {
          .vi-chip:hover  { border-color: #BDBDC6; }
          .vi-ficha:hover .vi-plato img { transform: scale(1.06); }
        }
        .vi-chip:active, .vi-cta:active, .vi-ficha:active { transform: scale(0.98); }

        @media (prefers-reduced-motion: reduce) {
          .vi-ficha { opacity: 1; transform: none; animation: none; }
          .vi * { transition: none !important; }
        }
        @media (max-width: 880px) {
          .vi-escena { grid-template-columns: 1fr; align-items: start; }
          .vi-trio { justify-content: center; margin-top: 10px; }
          .vi-sello { position: static; display: inline-block; margin-top: 14px; transform: none; }
        }
      `}</style>

      <div style={{ background: '#17171C', color: '#C9C9D1', textAlign: 'center', padding: '8px 16px', fontSize: 12.5, fontWeight: 600 }}>
        Opción B: Vitrina. Maqueta desechable.
      </div>

      <section className="vi-portada">
        <div className="vi-interior">
          <nav className="vi-nav">
            <span style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>Jango&apos;s Store</span>
            <a href="#catalogo">Tienda</a>
            <a href="#catalogo">Preventas</a>
            <a href="#catalogo">Apartados</a>
          </nav>

          <div className="vi-escena">
            <div style={{ paddingBottom: 'clamp(30px, 5vw, 62px)' }}>
              <h1 style={{ fontSize: 'clamp(36px, 5.2vw, 70px)', fontWeight: 800, lineHeight: 1.03 }}>
                Figuras que no<br />consigues en tienda
              </h1>
              <p style={{ fontSize: 'clamp(15px, 1.5vw, 17px)', lineHeight: 1.6, color: '#D7CBF7', margin: '18px 0 0', maxWidth: '38ch' }}>
                Originales, revisadas pieza por pieza. Apartados desde el 60 por ciento.
              </p>
              <a href="#catalogo" className="vi-cta" style={{ marginTop: 26 }}>Ver el catálogo</a>
            </div>

            <div style={{ position: 'relative' }}>
              <div className="vi-trio">
                {trio.map((f, i) => (
                  <div key={f.t} style={{ zIndex: 3 - i }}>
                    <Image src={f.img} alt={f.t} width={420} height={420} priority={i === 0}
                      style={{ width: `clamp(${90 - i * 8}px, ${15 - i * 1.4}vw, ${210 - i * 22}px)` }} />
                  </div>
                ))}
              </div>
              <span className="vi-sello">Nuevas cada semana</span>
            </div>
          </div>
        </div>
      </section>

      <div className="vi-tira" id="catalogo">
        {TEMAS.map(t => (
          <button key={t} type="button" className="vi-chip" aria-pressed={tema === t} onClick={() => setTema(t)}>
            {t}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 14, color: 'var(--gris)', whiteSpace: 'nowrap' }}>
          {lista.length} figuras
        </span>
      </div>

      <div className="vi-rejilla">
        {lista.map((f, i) => (
          <a key={f.t} href="#catalogo" className="vi-ficha" style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}>
            {f.nota && <span className="vi-nota">{f.nota}</span>}
            <div className="vi-plato">
              <Image src={f.img} alt={f.t} width={400} height={400} priority={i < 4} />
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--gris)' }}>{f.tema}</span>
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, margin: '3px 0 6px' }}>{f.t}</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{precio(f.p)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
