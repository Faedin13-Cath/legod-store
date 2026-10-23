'use client'

/**
 * ███ MAQUETA DESECHABLE ███
 *
 * Borrador visual para decidir hacia dónde va la tienda. No está ligada desde
 * ningún lado y no comparte componentes con el sitio real: se puede borrar
 * entera sin tocar nada que funcione.
 *
 * La idea: la marca ya tiene morado, dorado y azul tinta, pero hoy los usa
 * como acentos tímidos sobre crema. Aquí el color se usa en BLOQUES grandes,
 * las cosas se enciman, y las figuras salen recortadas sobre el color.
 *
 * Productos y fotos: reales, de la tienda.
 */

import Image from 'next/image'

const MORADO = '#5526AD'
const MORADO_BRILLANTE = '#6050DC'
const DORADO = '#E2A91A'
const TINTA = '#1A1E5A'
const CREMA = '#F5F3EF'

type Figura = { t: string; p: number; img: string }

const DESTACADA: Figura = {
  t: 'Darth Maul',
  p: 900,
  img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sw0384.png?v=1791321948',
}

const NUEVAS: Figura[] = [
  { t: 'Taskmaster', p: 300, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0100.png?v=1787789994' },
  { t: 'Iron Man Mark 6', p: 250, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0015.png?v=1790042228' },
  { t: 'Doctor Strange', p: 100, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0802.png?v=1790042258' },
  { t: 'Venom navideño', p: 120, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-6.png?v=1790042311' },
  { t: 'Miles Morales', p: 150, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/76293-14.png?v=1790042310' },
  { t: 'Storm', p: 120, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/colmar23_15fdb798-3efd-4616-b05f-6daa243270eb.png?v=1791134171' },
  { t: 'Hawkeye', p: 110, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0570_04ffa12e-764c-4fd7-8ef0-a564a51a5e30.png?v=1787196888' },
  { t: 'Ant-Man', p: 100, img: 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh0563_fa945662-9cbc-4648-8dbd-27d966f745df.png?v=1787196887' },
]

// Los mundos de la tienda, cada uno con su color. El color ES la navegación.
const MUNDOS = [
  { n: 'Star Wars',       bg: '#1A1E5A', fg: '#FFFFFF', c: 412 },
  { n: 'Marvel',          bg: '#D92B3A', fg: '#FFFFFF', c: 388 },
  { n: 'DC',              bg: '#1763D1', fg: '#FFFFFF', c: 146 },
  { n: 'Harry Potter',    bg: '#E2A91A', fg: '#1A1E5A', c: 97  },
  { n: 'Stranger Things', bg: '#13111C', fg: '#F05A28', c: 34  },
  { n: 'Ninjago',         bg: '#17A34A', fg: '#FFFFFF', c: 58  },
  { n: 'Customs',         bg: '#5526AD', fg: '#FFFFFF', c: 211 },
  { n: 'Deportes',        bg: '#F2F0EA', fg: '#1A1E5A', c: 29  },
]

const precio = (n: number) => '$' + n.toLocaleString('es-MX')

export default function MockInicio() {
  return (
    <div style={{ background: CREMA, minHeight: '100dvh', overflowX: 'hidden' }}>
      <style>{`
        .mk { --borde: 3px solid ${TINTA}; }
        .mk h1, .mk h2 { letter-spacing: -0.035em; line-height: 0.92; margin: 0; }
        .mk-ficha {
          transition: transform .18s cubic-bezier(.16,1,.3,1), box-shadow .18s;
        }
        @media (hover: hover) {
          .mk-ficha:hover { transform: translateY(-6px) rotate(-1deg); }
          .mk-mundo:hover { transform: translateY(-4px); }
          .mk-pill:hover { transform: translateY(-2px); }
        }
        .mk-ficha:active { transform: scale(.985); }
        .mk-mundo { transition: transform .18s cubic-bezier(.16,1,.3,1); }
        .mk-pill  { transition: transform .15s; }
        .mk-fila::-webkit-scrollbar { height: 6px; }
        .mk-fila::-webkit-scrollbar-thumb { background: ${TINTA}33; border-radius: 99px; }
        @media (prefers-reduced-motion: reduce) {
          .mk-ficha, .mk-mundo, .mk-pill { transition: none !important; transform: none !important; }
        }
        .mk-hero-grid { display: grid; grid-template-columns: 1.15fr .85fr; gap: 0; align-items: stretch; }
        .mk-mundos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .mk-rejilla { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) {
          .mk-hero-grid { grid-template-columns: 1fr; }
          .mk-mundos   { grid-template-columns: repeat(2, 1fr); }
          .mk-rejilla  { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div style={{
        background: TINTA, color: '#fff', textAlign: 'center',
        padding: '8px 16px', fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em',
      }}>
        Maqueta desechable. No es la tienda real.
      </div>

      <div className="mk">

        {/* ─────────── Portada: bloque de color a sangre, la figura encimada ─────────── */}
        <section style={{ position: 'relative' }}>
          <div className="mk-hero-grid">
            <div style={{
              background: MORADO, color: '#fff',
              padding: 'clamp(40px, 7vw, 84px) clamp(22px, 5vw, 64px) clamp(56px, 7vw, 84px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <h1 style={{ fontSize: 'clamp(44px, 7.5vw, 104px)', fontWeight: 800 }}>
                Figuras que<br />
                no consigues<br />
                <span style={{ color: DORADO }}>en tienda.</span>
              </h1>
              <p style={{
                fontSize: 'clamp(15px, 1.6vw, 19px)', lineHeight: 1.5, margin: '22px 0 0',
                maxWidth: '34ch', color: '#E9E2FB',
              }}>
                Star Wars, Marvel, DC y customs. Originales, revisadas una por una.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 30, flexWrap: 'wrap' }}>
                <a href="#rejilla" className="mk-pill" style={{
                  background: DORADO, color: TINTA, borderRadius: 999,
                  padding: '15px 30px', fontSize: 16, fontWeight: 800,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>Ver la tienda</a>
                <a href="#mundos" className="mk-pill" style={{
                  background: 'transparent', color: '#fff', border: '2px solid #ffffff66',
                  borderRadius: 999, padding: '13px 28px', fontSize: 16, fontWeight: 700,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>Por tema</a>
              </div>
            </div>

            <div style={{
              background: DORADO, position: 'relative',
              minHeight: 'clamp(300px, 42vw, 540px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            }}>
              <Image
                src={DESTACADA.img} alt={DESTACADA.t} width={620} height={620} priority
                style={{
                  width: 'min(86%, 420px)', height: 'auto', objectFit: 'contain',
                  filter: 'drop-shadow(0 26px 40px rgba(26,30,90,.42))',
                }}
              />
              {/* Etiqueta de precio encimada sobre el borde de los dos bloques */}
              <div style={{
                position: 'absolute', left: 'clamp(-26px, -2vw, -10px)', top: 'clamp(26px, 5vw, 54px)',
                background: '#fff', color: TINTA, borderRadius: 18,
                padding: '12px 18px', boxShadow: '0 18px 40px rgba(26,30,90,.3)',
                transform: 'rotate(-4deg)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: .62 }}>{DESTACADA.t}</div>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.05 }}>{precio(DESTACADA.p)}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────── Los mundos: el color es la navegación ─────────── */}
        <section id="mundos" style={{ padding: 'clamp(44px, 6vw, 76px) clamp(18px, 4vw, 48px)' }}>
          <h2 style={{ fontSize: 'clamp(30px, 4.4vw, 54px)', fontWeight: 800, color: TINTA, marginBottom: 22 }}>
            Escoge tu mundo
          </h2>
          <div className="mk-mundos">
            {MUNDOS.map(m => (
              <a key={m.n} href="#rejilla" className="mk-mundo" style={{
                background: m.bg, color: m.fg, borderRadius: 24,
                padding: '22px 20px 18px', minHeight: 132, textDecoration: 'none',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 'clamp(19px, 2vw, 26px)', fontWeight: 800, lineHeight: 1.04, letterSpacing: '-0.02em' }}>
                  {m.n}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, opacity: .76 }}>{m.c} figuras</span>
              </a>
            ))}
          </div>
        </section>

        {/* ─────────── Lo nuevo: fila que se arrastra, rompe la rejilla ─────────── */}
        <section style={{ padding: '0 0 clamp(44px, 6vw, 72px)' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap',
            padding: '0 clamp(18px, 4vw, 48px) 18px',
          }}>
            <h2 style={{ fontSize: 'clamp(30px, 4.4vw, 54px)', fontWeight: 800, color: TINTA }}>
              Recién llegadas
            </h2>
            <span style={{ fontSize: 15, color: '#4F5180', fontWeight: 600 }}>cada semana</span>
          </div>
          <div className="mk-fila" style={{
            display: 'flex', gap: 14, overflowX: 'auto', scrollSnapType: 'x mandatory',
            padding: '4px clamp(18px, 4vw, 48px) 14px',
          }}>
            {NUEVAS.map((f, i) => (
              <article key={f.t} className="mk-ficha" style={{
                flex: '0 0 auto', width: 212, scrollSnapAlign: 'start',
                background: i % 3 === 0 ? MORADO_BRILLANTE : '#fff',
                color: i % 3 === 0 ? '#fff' : TINTA,
                borderRadius: 24, padding: 14, border: i % 3 === 0 ? 'none' : '1px solid #E6E4DD',
              }}>
                <div style={{
                  background: i % 3 === 0 ? '#ffffff1f' : CREMA, borderRadius: 16,
                  height: 182, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Image src={f.img} alt={f.t} width={300} height={300}
                    style={{ width: '78%', height: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, minHeight: 36 }}>{f.t}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{precio(f.p)}</div>
              </article>
            ))}
          </div>
        </section>

        {/* ─────────── Bloque a sangre: un solo mensaje ─────────── */}
        <section style={{
          background: TINTA, color: '#fff',
          padding: 'clamp(44px, 6vw, 80px) clamp(22px, 5vw, 64px)',
          display: 'grid', gridTemplateColumns: '1fr', gap: 20,
        }}>
          <h2 style={{ fontSize: 'clamp(32px, 5.4vw, 68px)', fontWeight: 800, maxWidth: '18ch' }}>
            Apártala con el <span style={{ color: DORADO }}>60%</span> y págala en 7 días.
          </h2>
          <a href="#rejilla" className="mk-pill" style={{
            background: DORADO, color: TINTA, borderRadius: 999, padding: '15px 30px',
            fontSize: 16, fontWeight: 800, textDecoration: 'none', justifySelf: 'start',
          }}>Ver la tienda</a>
        </section>

        {/* ─────────── La rejilla de verdad ─────────── */}
        <section id="rejilla" style={{ padding: 'clamp(44px, 6vw, 76px) clamp(18px, 4vw, 48px) 90px' }}>
          <h2 style={{ fontSize: 'clamp(30px, 4.4vw, 54px)', fontWeight: 800, color: TINTA, marginBottom: 22 }}>
            Todas las figuras
          </h2>
          <div className="mk-rejilla">
            {[...NUEVAS, ...NUEVAS].slice(0, 8).map((f, i) => (
              <article key={i} className="mk-ficha" style={{
                background: '#fff', borderRadius: 24, padding: 14,
                border: '1px solid #E6E4DD', color: TINTA,
              }}>
                <div style={{
                  background: CREMA, borderRadius: 16, height: 186,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                }}>
                  <Image src={f.img} alt={f.t} width={300} height={300}
                    style={{ width: '76%', height: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, minHeight: 36 }}>{f.t}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{precio(f.p)}</div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
