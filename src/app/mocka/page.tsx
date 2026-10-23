'use client'

/**
 * ███ MAQUETA DESECHABLE · OPCIÓN A: "GALERÍA" ███
 *
 * La apuesta: que se vea caro por contención, no por ruido. Una sola familia
 * tipográfica en muchos tamaños, rejilla estricta, mucho aire, y el morado de
 * marca apareciendo poquísimo (precio y acción). Es la escuela de Aesop.
 *
 * Lo que hace el trabajo pesado no es el color: es que TODAS las figuras van
 * en un plato idéntico, al mismo tamaño y con la misma sombra. Esa constancia
 * es lo que separa una rejilla profesional de una amateur.
 */

import Image from 'next/image'
import { FIGURAS, precio } from '../mockdatos'

export default function MockA() {
  return (
    <div className="ga">
      <style>{`
        header, footer { display: none !important; }

        .ga {
          --papel:  #FFFFFF;
          --hueso:  #F3F3F5;   /* neutro de verdad, sin tinte cálido */
          --tinta:  #16161A;
          --gris:   #5E5E68;   /* 6.4:1 sobre hueso */
          --linea:  #E2E2E6;
          --acento: #5526AD;
          --ease:   cubic-bezier(0.23, 1, 0.32, 1);
          background: var(--papel); color: var(--tinta); min-height: 100dvh;
        }
        .ga h1, .ga h2 { margin: 0; letter-spacing: -0.025em; text-wrap: balance; }

        .ga-nav {
          display: flex; align-items: center; gap: 26px;
          padding: 22px clamp(20px, 5vw, 64px);
          border-bottom: 1px solid var(--linea);
          font-size: 14.5px; color: var(--gris);
        }
        .ga-nav a { color: inherit; text-decoration: none; transition: color 160ms var(--ease); }

        /* Portada: una figura, mucho aire, el texto chico y seguro */
        .ga-portada {
          display: grid; grid-template-columns: 1fr 1fr; align-items: center;
          gap: clamp(24px, 5vw, 72px);
          padding: clamp(48px, 8vw, 110px) clamp(20px, 5vw, 64px);
          max-width: 1400px; margin: 0 auto;
        }
        .ga-plato-grande {
          background: var(--hueso); border-radius: 4px;
          aspect-ratio: 4 / 5; display: flex; align-items: center; justify-content: center;
        }

        .ga-cta {
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--tinta); color: #fff; border: none; border-radius: 2px;
          padding: 15px 30px; font-size: 15px; font-weight: 600; font-family: inherit;
          text-decoration: none; cursor: pointer; min-height: 48px;
          transition: transform 140ms var(--ease), background 160ms var(--ease);
        }

        /* Catálogo: rejilla estricta, separadores finos, nada de tarjetas */
        .ga-rejilla {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(236px, 1fr));
          gap: clamp(28px, 3vw, 48px) clamp(20px, 2vw, 32px);
          padding: 0 clamp(20px, 5vw, 64px) 110px;
          max-width: 1400px; margin: 0 auto;
        }
        .ga-ficha {
          display: flex; flex-direction: column; text-decoration: none; color: inherit;
          opacity: 0; transform: translateY(8px);
          animation: ga-entra 420ms var(--ease) forwards;
        }
        @keyframes ga-entra { to { opacity: 1; transform: translateY(0); } }

        /* El plato idéntico para todas: misma caja, misma proporción, misma sombra */
        .ga-plato {
          background: var(--hueso); border-radius: 4px; aspect-ratio: 1;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px; overflow: hidden;
        }
        .ga-plato img {
          width: 62%; height: auto; object-fit: contain;
          filter: drop-shadow(0 10px 14px rgba(22,22,26,.14));
          transition: transform 260ms var(--ease);
        }

        @media (hover: hover) and (pointer: fine) {
          .ga-nav a:hover { color: var(--tinta); }
          .ga-ficha:hover .ga-plato img { transform: scale(1.05); }
          .ga-cta:hover { background: var(--acento); }
        }
        .ga-cta:active, .ga-ficha:active { transform: scale(0.98); }

        @media (prefers-reduced-motion: reduce) {
          .ga-ficha { opacity: 1; transform: none; animation: none; }
          .ga * { transition: none !important; }
        }
        @media (max-width: 820px) {
          .ga-portada { grid-template-columns: 1fr; padding-top: 32px; }
          .ga-plato-grande { order: -1; aspect-ratio: 1; }
        }
      `}</style>

      <div style={{ background: '#16161A', color: '#C9C9D1', textAlign: 'center', padding: '8px 16px', fontSize: 12.5, fontWeight: 600 }}>
        Opción A: Galería. Maqueta desechable.
      </div>

      <nav className="ga-nav">
        <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--tinta)', letterSpacing: '-0.02em' }}>Jango&apos;s Store</span>
        <a href="#catalogo">Tienda</a>
        <a href="#catalogo">Preventas</a>
        <a href="#catalogo">Apartados</a>
      </nav>

      <section className="ga-portada">
        <div>
          <h1 style={{ fontSize: 'clamp(34px, 4.6vw, 62px)', fontWeight: 500, lineHeight: 1.08 }}>
            Minifiguras que no llegan a México
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--gris)', margin: '20px 0 0', maxWidth: '42ch' }}>
            Originales, revisadas pieza por pieza. Star Wars, Marvel, DC y customs,
            con apartados desde el 60 por ciento.
          </p>
          <a href="#catalogo" className="ga-cta" style={{ marginTop: 32 }}>Ver el catálogo</a>
        </div>
        <div className="ga-plato-grande">
          <Image src={FIGURAS[0].img} alt={FIGURAS[0].t} width={620} height={620} priority
            style={{ width: '56%', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 22px 30px rgba(22,22,26,.18))' }} />
        </div>
      </section>

      <div id="catalogo" style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16,
        padding: '0 clamp(20px, 5vw, 64px) 26px', maxWidth: 1400, margin: '0 auto',
        borderBottom: '1px solid var(--linea)', paddingBottom: 18, marginBottom: 40,
      }}>
        <h2 style={{ fontSize: 'clamp(22px, 2.4vw, 30px)', fontWeight: 500 }}>Catálogo</h2>
        <span style={{ fontSize: 14, color: 'var(--gris)' }}>{FIGURAS.length} figuras</span>
      </div>

      <div className="ga-rejilla">
        {FIGURAS.map((f, i) => (
          <a key={f.t} href="#catalogo" className="ga-ficha" style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}>
            <div className="ga-plato">
              <Image src={f.img} alt={f.t} width={400} height={400} priority={i < 4} />
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--gris)' }}>{f.tema}</span>
            <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.35, margin: '3px 0 6px' }}>{f.t}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--acento)' }}>{precio(f.p)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
