'use client'

/**
 * ███ MAQUETA DESECHABLE ███
 *
 * La misma idea que /mockinicio, aplicada al problema difícil: una tienda
 * tiene que MOSTRAR producto, no solo verse bien.
 *
 * Decisiones:
 *  - Fondo oscuro para que el plástico de colores sea lo más brillante.
 *  - Los filtros son una barra pegada, con el conteo vivo al lado.
 *  - La rejilla se adapta sola (auto-fit) en vez de romperse por breakpoints.
 *  - El precio en dorado es lo único de color fuerte dentro de la ficha,
 *    así se escanea una columna de precios de un vistazo.
 *
 * Productos y fotos: reales, de la tienda.
 */

import { useMemo, useState } from 'react'
import Image from 'next/image'

type Figura = { t: string; p: number; img: string; tema: string; nota?: string }

const FIGURAS: Figura[] = [
  { t: 'Darth Maul, brazos rojos impresos', p: 900, tema: 'Star Wars', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sw0384.png?v=1791321948' },
  { t: 'Taskmaster, capa y capucha blancas', p: 300, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0100.png?v=1787789994' },
  { t: 'Iron Man, armadura Mark 6', p: 250, tema: 'Marvel', nota: 'Nuevo', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0015.png?v=1790042228' },
  { t: 'Miles Morales con audífonos', p: 150, tema: 'Marvel', nota: 'Nuevo', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-14.png?v=1790042310' },
  { t: 'Venom con bufanda y hot dog', p: 120, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-6.png?v=1790042311' },
  { t: 'Storm, Marvel Studios Serie 2', p: 120, tema: 'Marvel', nota: 'Sin accesorios', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/colmar23_15fdb798-3efd-4616-b05f-6daa243270eb.png?v=1791134171' },
  { t: 'Hawkeye, traje blanco', p: 110, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0570_04ffa12e-764c-4fd7-8ef0-a564a51a5e30.png?v=1787196888' },
  { t: 'Doctor Strange, capa de hule', p: 100, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0802.png?v=1790042258' },
  { t: 'Ant-Man, traje blanco', p: 100, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0563_fa945662-9cbc-4648-8dbd-27d966f745df.png?v=1787196887' },
  { t: 'War Machine, traje blanco', p: 90, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0564_9d69588c-2f04-4c84-89c8-834a40ebb76a.png?v=1787196888' },
  { t: 'Nebula, traje blanco', p: 80, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0574_012ffa38-72f2-4405-b598-fb2d9af4b905.png?v=1787196887' },
]

const FILTROS = ['Todas', 'Star Wars', 'Marvel', 'Menos de $150'] as const
const precio = (n: number) => '$' + n.toLocaleString('es-MX')

export default function MockProductos() {
  const [activo, setActivo] = useState<typeof FILTROS[number]>('Todas')

  const lista = useMemo(() => {
    if (activo === 'Todas') return FIGURAS
    if (activo === 'Menos de $150') return FIGURAS.filter(f => f.p < 150)
    return FIGURAS.filter(f => f.tema === activo)
  }, [activo])

  return (
    <div className="mp">
      <style>{`
        header { display: none !important; }
        footer { display: none !important; }

        .mp {
          --fondo:  #17062E;
          --alto:   #22093F;
          --morado: #7B4BE8;
          --oro:    #F0B429;
          --texto:  #F4F1FB;
          --tenue:  #BCADD8;
          --ease:   cubic-bezier(0.23, 1, 0.32, 1);
          background: var(--fondo); color: var(--texto); min-height: 100dvh;
        }
        .mp h1 { margin: 0; letter-spacing: -0.03em; }

        .mp-barra {
          position: sticky; top: 0; z-index: 10;
          background: rgba(23,6,46,.88); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(244,241,251,.08);
          padding: 14px clamp(18px, 4vw, 56px);
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .mp-filtro {
          border: 1px solid rgba(244,241,251,.18); background: transparent;
          color: var(--texto); border-radius: 999px; padding: 10px 18px;
          font-size: 14.5px; font-weight: 600; font-family: inherit;
          cursor: pointer; min-height: 44px; white-space: nowrap;
          transition: background 160ms var(--ease), border-color 160ms var(--ease), color 160ms var(--ease), transform 140ms var(--ease);
        }
        .mp-filtro[aria-pressed="true"] {
          background: var(--morado); border-color: var(--morado); color: #fff;
        }

        .mp-rejilla {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px; padding: clamp(20px, 3vw, 32px) clamp(18px, 4vw, 56px) 90px;
        }
        .mp-ficha {
          position: relative; background: var(--alto); border-radius: 20px; padding: 14px;
          border: 1px solid rgba(244,241,251,.07);
          display: flex; flex-direction: column;
          opacity: 0; transform: translateY(10px);
          animation: mp-entra 420ms var(--ease) forwards;
          transition: transform 180ms var(--ease), border-color 180ms var(--ease);
        }
        @keyframes mp-entra { to { opacity: 1; transform: translateY(0); } }

        .mp-plato {
          background: rgba(244,241,251,.05); border-radius: 14px; height: 196px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
        }
        .mp-plato img { transition: transform 220ms var(--ease); }

        .mp-nota {
          position: absolute; top: 22px; left: 22px; z-index: 2;
          background: var(--morado); color: #fff; border-radius: 999px;
          padding: 4px 11px; font-size: 11px; font-weight: 800; letter-spacing: .01em;
        }

        @media (hover: hover) and (pointer: fine) {
          .mp-filtro:hover { background: rgba(244,241,251,.1); border-color: rgba(244,241,251,.34); }
          .mp-ficha:hover  { transform: translateY(-4px); border-color: rgba(123,75,232,.5); }
          .mp-ficha:hover .mp-plato img { transform: scale(1.06); }
        }
        .mp-filtro:active, .mp-ficha:active { transform: scale(0.97); }

        @media (prefers-reduced-motion: reduce) {
          .mp-ficha { opacity: 1; transform: none; animation: none; }
          .mp *, .mp *::before { transition: none !important; }
        }
      `}</style>

      <div style={{
        background: '#0D0318', color: '#BCADD8', textAlign: 'center',
        padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
      }}>
        Maqueta desechable. No es la tienda real.
      </div>

      <div style={{ padding: 'clamp(26px, 3.6vw, 44px) clamp(18px, 4vw, 56px) 18px' }}>
        <h1 style={{ fontSize: 'clamp(30px, 4.4vw, 56px)', fontWeight: 800, lineHeight: 1.04 }}>
          La tienda
        </h1>
      </div>

      <div className="mp-barra">
        {FILTROS.map(f => (
          <button key={f} type="button" className="mp-filtro"
            aria-pressed={activo === f} onClick={() => setActivo(f)}>
            {f}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--tenue)', fontWeight: 600 }}>
          {lista.length} {lista.length === 1 ? 'figura' : 'figuras'}
        </span>
      </div>

      {lista.length === 0 ? (
        <div style={{
          margin: 'clamp(32px, 5vw, 56px) clamp(18px, 4vw, 56px) 90px',
          border: '1px dashed rgba(244,241,251,.22)', borderRadius: 20,
          padding: '56px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Nada con ese filtro</div>
          <p style={{ color: 'var(--tenue)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Escríbenos y la conseguimos.
          </p>
          <button type="button" className="mp-filtro" onClick={() => setActivo('Todas')}>
            Ver todas
          </button>
        </div>
      ) : (
        <div className="mp-rejilla">
          {lista.map((f, i) => (
            <article key={f.t} className="mp-ficha" style={{ animationDelay: `${Math.min(i, 9) * 45}ms` }}>
              {f.nota && <span className="mp-nota">{f.nota}</span>}
              <div className="mp-plato">
                <Image src={f.img} alt={f.t} width={360} height={360} priority={i < 4}
                  style={{ width: '72%', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--tenue)', fontWeight: 600 }}>{f.tema}</div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, margin: '2px 0 10px' }}>{f.t}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--oro)', marginTop: 'auto' }}>
                {precio(f.p)}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
