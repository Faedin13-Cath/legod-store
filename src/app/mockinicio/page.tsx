'use client'

/**
 * ███ MAQUETA DESECHABLE ███
 *
 * Segundo intento. El primero falló por la razón de fondo: puse las figuras a
 * competir contra bloques de color enormes, y una minifigura sobre crema o
 * sobre amarillo se pierde.
 *
 * La idea ahora: la página es morado profundo, casi negro, y las figuras son
 * lo único brillante. El plástico de colores resalta sobre oscuro. Un solo
 * color manda la superficie; el dorado aparece solo en los precios.
 *
 * Productos y fotos: reales, de la tienda. Los conteos por tema son de relleno.
 */

import Image from 'next/image'

type Figura = { t: string; p: number; img: string; tema: string }

const DESTACADA: Figura = {
  t: 'Darth Maul', p: 900, tema: 'Star Wars',
  img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sw0384.png?v=1791321948',
}

const FIGURAS: Figura[] = [
  { t: 'Taskmaster', p: 300, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0100.png?v=1787789994' },
  { t: 'Iron Man Mark 6', p: 250, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0015.png?v=1790042228' },
  { t: 'Miles Morales', p: 150, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-14.png?v=1790042310' },
  { t: 'Venom navideño', p: 120, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-6.png?v=1790042311' },
  { t: 'Storm', p: 120, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/colmar23_15fdb798-3efd-4616-b05f-6daa243270eb.png?v=1791134171' },
  { t: 'Hawkeye', p: 110, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0570_04ffa12e-764c-4fd7-8ef0-a564a51a5e30.png?v=1787196888' },
  { t: 'Doctor Strange', p: 100, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0802.png?v=1790042258' },
  { t: 'Ant-Man', p: 100, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0563_fa945662-9cbc-4648-8dbd-27d966f745df.png?v=1787196887' },
  { t: 'War Machine', p: 90, tema: 'Marvel', img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0564_9d69588c-2f04-4c84-89c8-834a40ebb76a.png?v=1787196888' },
]

const TEMAS = ['Star Wars', 'Marvel', 'DC', 'Harry Potter', 'Stranger Things', 'Ninjago', 'Customs', 'Deportes']

const precio = (n: number) => '$' + n.toLocaleString('es-MX')

export default function MockInicio() {
  return (
    <div className="mi">
      <style>{`
        /* La barra crema del sitio pelea con una página oscura. En la maqueta
           se esconde para poder juzgar la idea completa, no un pegote. */
        header { display: none !important; }
        footer { display: none !important; }

        .mi {
          --fondo:  #17062E;   /* morado casi negro: la superficie ES el color */
          --alto:   #22093F;   /* un escalón arriba, para separar sin bordes */
          --morado: #7B4BE8;   /* el morado de marca, subido para brillar en oscuro */
          --oro:    #F0B429;   /* único acento, solo precios y la acción principal */
          --texto:  #F4F1FB;
          --tenue:  #BCADD8;   /* 6.1:1 sobre el fondo, legible de verdad */
          --ease:   cubic-bezier(0.23, 1, 0.32, 1);

          background: var(--fondo);
          color: var(--texto);
          min-height: 100dvh;
          overflow-x: hidden;
        }
        .mi h1, .mi h2 { margin: 0; letter-spacing: -0.03em; text-wrap: balance; }

        .mi-marca {
          display: flex; align-items: center; gap: 10px;
          padding: 20px clamp(18px, 4vw, 56px);
        }

        /* Portada: la figura manda, el texto la acompaña */
        .mi-portada {
          display: grid; grid-template-columns: 1fr 1fr; align-items: center;
          gap: clamp(20px, 4vw, 56px);
          padding: clamp(8px, 2vw, 24px) clamp(18px, 4vw, 56px) clamp(48px, 7vw, 92px);
        }
        .mi-halo {
          position: relative; display: flex; align-items: center; justify-content: center;
          min-height: clamp(320px, 40vw, 520px);
        }
        /* El resplandor es lo que hace que el plástico se vea iluminado */
        .mi-halo::before {
          content: ""; position: absolute; width: 78%; aspect-ratio: 1; border-radius: 50%;
          background: radial-gradient(circle, rgba(123,75,232,.55) 0%, rgba(123,75,232,0) 68%);
          filter: blur(10px);
        }
        .mi-halo img { position: relative; }

        .mi-precio {
          position: absolute; right: 2%; bottom: 10%;
          background: var(--oro); color: #17062E;
          border-radius: 999px; padding: 10px 20px;
          font-size: clamp(18px, 2vw, 24px); font-weight: 800;
          box-shadow: 0 14px 34px rgba(0,0,0,.45);
        }

        /* Temas: una tira que se arrastra, no ocho cuadros de colores distintos */
        .mi-tira {
          display: flex; gap: 8px; overflow-x: auto;
          padding: 0 clamp(18px, 4vw, 56px) clamp(40px, 5vw, 64px);
          scrollbar-width: none;
        }
        .mi-tira::-webkit-scrollbar { display: none; }
        .mi-tema {
          flex: 0 0 auto; border: 1px solid rgba(244,241,251,.18);
          background: transparent; color: var(--texto);
          border-radius: 999px; padding: 11px 20px; font-size: 15px; font-weight: 600;
          font-family: inherit; cursor: pointer; min-height: 44px;
          transition: background 160ms var(--ease), border-color 160ms var(--ease), transform 140ms var(--ease);
        }

        /* Rejilla: celdas de dos tamaños, tantas como productos hay */
        .mi-rejilla {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 14px; padding: 0 clamp(18px, 4vw, 56px) clamp(56px, 7vw, 96px);
        }
        .mi-ficha {
          background: var(--alto); border-radius: 20px; padding: 14px;
          border: 1px solid rgba(244,241,251,.07);
          display: flex; flex-direction: column;
          opacity: 0; transform: translateY(10px);
          animation: mi-entra 460ms var(--ease) forwards;
          transition: transform 180ms var(--ease), border-color 180ms var(--ease);
        }
        .mi-ficha:nth-child(1){animation-delay:0ms}   .mi-ficha:nth-child(2){animation-delay:45ms}
        .mi-ficha:nth-child(3){animation-delay:90ms}  .mi-ficha:nth-child(4){animation-delay:135ms}
        .mi-ficha:nth-child(5){animation-delay:180ms} .mi-ficha:nth-child(6){animation-delay:225ms}
        .mi-ficha:nth-child(7){animation-delay:270ms} .mi-ficha:nth-child(8){animation-delay:315ms}
        .mi-ficha:nth-child(9){animation-delay:360ms}
        @keyframes mi-entra { to { opacity: 1; transform: translateY(0); } }

        .mi-plato {
          background: rgba(244,241,251,.05); border-radius: 14px; height: 190px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
        }
        .mi-plato img { transition: transform 220ms var(--ease); }

        .mi-cta {
          background: var(--oro); color: #17062E; border: none; border-radius: 999px;
          padding: 15px 30px; font-size: 16px; font-weight: 800; font-family: inherit;
          cursor: pointer; min-height: 48px; text-decoration: none;
          display: inline-flex; align-items: center; justify-content: center;
          transition: transform 140ms var(--ease);
        }

        @media (hover: hover) and (pointer: fine) {
          .mi-tema:hover  { background: rgba(244,241,251,.1); border-color: rgba(244,241,251,.34); }
          .mi-ficha:hover { transform: translateY(-4px); border-color: rgba(123,75,232,.5); }
          .mi-ficha:hover .mi-plato img { transform: scale(1.06); }
        }
        .mi-tema:active, .mi-cta:active, .mi-ficha:active { transform: scale(0.97); }

        @media (prefers-reduced-motion: reduce) {
          .mi-ficha { opacity: 1; transform: none; animation: none; }
          .mi *, .mi *::before { transition: none !important; }
        }
        @media (max-width: 860px) {
          .mi-portada { grid-template-columns: 1fr; text-align: left; }
          .mi-halo { order: -1; min-height: 280px; }
        }
      `}</style>

      <div style={{
        background: '#0D0318', color: '#BCADD8', textAlign: 'center',
        padding: '8px 16px', fontSize: 12.5, fontWeight: 600,
      }}>
        Maqueta desechable. No es la tienda real.
      </div>

      <div className="mi-marca">
        <Image src="/assets/logo/legod-logo-violet-128.webp" alt="" width={34} height={34} style={{ borderRadius: '50%' }} />
        <span style={{ fontWeight: 800, fontSize: 19 }}>Jango&apos;s Store</span>
      </div>

      <section className="mi-portada">
        <div>
          <h1 style={{ fontSize: 'clamp(38px, 5.6vw, 76px)', fontWeight: 800, lineHeight: 1.02 }}>
            Figuras que no<br />consigues en tienda
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 1.5vw, 18px)', lineHeight: 1.6, color: 'var(--tenue)',
            margin: '18px 0 0', maxWidth: '38ch',
          }}>
            Star Wars, Marvel, DC y customs. Revisadas una por una antes de salir.
          </p>
          <a href="#rejilla" className="mi-cta" style={{ marginTop: 28 }}>Ver las figuras</a>
        </div>

        <div className="mi-halo">
          <Image
            src={DESTACADA.img} alt={DESTACADA.t} width={560} height={560} priority
            style={{
              width: 'min(74%, 340px)', height: 'auto', objectFit: 'contain',
              filter: 'drop-shadow(0 30px 44px rgba(0,0,0,.6))',
            }}
          />
          <span className="mi-precio">{precio(DESTACADA.p)}</span>
        </div>
      </section>

      <div className="mi-tira">
        {TEMAS.map(t => (
          <button key={t} type="button" className="mi-tema">{t}</button>
        ))}
      </div>

      <section id="rejilla">
        <h2 style={{
          fontSize: 'clamp(26px, 3.4vw, 42px)', fontWeight: 800, lineHeight: 1.05,
          padding: '0 clamp(18px, 4vw, 56px) 20px',
        }}>
          Recién llegadas
        </h2>
        <div className="mi-rejilla">
          {FIGURAS.map(f => (
            <article key={f.t} className="mi-ficha">
              <div className="mi-plato">
                <Image src={f.img} alt={f.t} width={320} height={320}
                  style={{ width: '72%', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--tenue)', fontWeight: 600 }}>{f.tema}</div>
              <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, margin: '2px 0 8px' }}>{f.t}</div>
              <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--oro)', marginTop: 'auto' }}>
                {precio(f.p)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{
        background: 'var(--alto)', padding: 'clamp(44px, 6vw, 80px) clamp(18px, 4vw, 56px)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 'clamp(26px, 3.6vw, 46px)', fontWeight: 800, lineHeight: 1.1, maxWidth: '20ch', margin: '0 auto' }}>
          Apártala con el <span style={{ color: 'var(--oro)' }}>60%</span> y págala en 7 días
        </h2>
        <p style={{ color: 'var(--tenue)', fontSize: 16, margin: '14px auto 0', maxWidth: '44ch', lineHeight: 1.6 }}>
          Te la guardamos desde que la apartas. Sin intereses y sin tarjeta.
        </p>
      </section>
    </div>
  )
}
