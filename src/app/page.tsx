'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Dragon from '@/components/ui/Dragon'
import Icon from '@/components/ui/Icon'
import ProductCard from '@/components/product/ProductCard'
import Reveal from '@/components/ui/Reveal'
import { useCart } from '@/components/cart/CartProvider'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import { cats } from '@/lib/data'
import type { Product } from '@/types'
import type React from 'react'

const TICKER = 'Star Wars · Marvel · DC · Harry Potter · Stranger Things · Deportes · Castle · Pixar · Custom · '

export default function HomePage() {
  const router      = useRouter()
  const { addItem } = useCart()
  const [allProducts, setAllProducts] = useState<Product[]>([])

  useEffect(() => {
    getProducts().then(raw => setAllProducts(raw.map(shopifyToProduct))).catch(() => {})
  }, [])

  const nav     = (p2: Product) => router.push(`/tienda/${p2.id}`)
  const nuevos  = allProducts.filter(p => p.tags.includes('nuevo')).slice(0, 7)
  const restock = allProducts.filter(p => p.tags.includes('restock')).slice(0, 7)
  const sets    = allProducts.filter(p => p.type === 'set-sealed').slice(0, 3)

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          HERO — full-viewport dark gradient
      ═══════════════════════════════════════════════════════ */}
      <section className="hero-section" style={{
        background: 'linear-gradient(150deg, #0F1240 0%, #1A1E5A 50%, #2D1869 100%)',
        position: 'relative', overflow: 'hidden',
        minHeight: '100svh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Atmospheric glow blobs */}
        <div style={{ position:'absolute', top:'10%', right:'20%', width:720, height:720, borderRadius:'50%', background:'radial-gradient(circle, rgba(85,38,173,0.5) 0%, transparent 70%)', filter:'blur(96px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-8%', left:'-6%', width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,80,220,0.38) 0%, transparent 70%)', filter:'blur(84px)', pointerEvents:'none' }} />
        <Dragon style={{ position:'absolute', right:'-3%', bottom:'-12%', width:'26%', color:'rgba(255,255,255,0.03)', pointerEvents:'none' }} />

        <div className="hero-inner" style={{ maxWidth:1280, margin:'0 auto', padding:'120px 48px 100px', position:'relative', zIndex:1, width:'100%' }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center' }}>

            {/* ── Left: copy ── */}
            <div>
              {/* Live-dot eyebrow */}
              <div className="anim-fade-right d-0 hero-eyebrow" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:999, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', marginBottom:28 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#F5C84A', animation:'pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.7)' }}>CDMX · Envíos a todo México e internacionales a cotizar</span>
              </div>

              {/* Mega headline */}
              <h1 className="anim-fade-up d-1 hero-h1" style={{
                fontSize:'clamp(64px, 8.5vw, 120px)', lineHeight:0.87,
                fontWeight:900, letterSpacing:'-0.04em',
                textTransform:'lowercase', color:'#fff', margin:'0 0 28px',
              }}>
                figuras<br/>
                que no<br/>
                <em style={{ color:'#F5C84A', fontStyle:'italic', fontWeight:800 }}>consigues</em><br/>
                en tienda
              </h1>

              <p className="anim-fade-up d-2 hero-desc" style={{ fontSize:17, color:'rgba(255,255,255,0.55)', lineHeight:1.65, maxWidth:400, margin:'0 0 36px' }}>
                Star Wars, Marvel, sports y más. Nuevos ingresos cada semana. Apartas con 40% y liquidas en 7 días.
              </p>

              {/* CTAs */}
              <div className="anim-fade-up d-3" style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:36 }}>
                <Link href="/tienda" className="btn-hero-primary">ver tienda →</Link>
                <Link href="/promos" className="btn-hero-secondary">promos activas</Link>
              </div>

              {/* Glass stat blocks */}
              <div className="anim-fade-up d-4 hero-stats" style={{ display:'flex', gap:8 }}>
                {[
                  { v:'4.9',  label:'320+ reseñas' },
                  { v:'1.2k+',label:'figuras vendidas' },
                  { v:'7 d',  label:'apartado gratis' },
                ].map(s => (
                  <div key={s.label} style={{ flex:1, padding:'12px 14px', borderRadius:14, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(8px)' }}>
                    <div style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.025em' }}>{s.v}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.44)', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', marginTop:3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: floating image ── */}
            <div className="hero-img-col" style={{ position:'relative', height:580 }}>
              {/* Main image card */}
              <div className="anim-scale-in d-2" style={{ position:'absolute', inset:0, borderRadius:32, overflow:'hidden', boxShadow:'0 48px 96px -24px rgba(0,0,0,0.7)', background:'#fff' }}>
                <div className="anim-float" style={{ position:'absolute', inset:0 }}>
                  <Image src="https://cdn.shopify.com/s/files/1/1012/4443/6789/files/sh1132.png" alt="Winter Soldier (Bucky) Minifig" fill style={{ objectFit:'contain', objectPosition:'center 30%' }} sizes="45vw" priority />
                </div>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 55%, rgba(15,18,64,0.55) 100%)' }} />
              </div>

              {/* Glass badge — promo */}
              <div className="anim-fade-up d-5" style={{ position:'absolute', bottom:28, left:-36, background:'rgba(15,18,64,0.72)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:20, padding:'14px 18px', zIndex:2, minWidth:184 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:600, marginBottom:5, letterSpacing:'0.04em' }}>🔥 Promo activa</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:3 }}>Bucky (Winter Soldier) · Marvel</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#F5C84A', letterSpacing:'-0.02em' }}>$950 MXN</div>
              </div>

              {/* Gold star badge */}
              <div className="anim-pop-in d-6 anim-float-soft" style={{ position:'absolute', top:24, left:-20, background:'#F5C84A', color:'#1A1E5A', borderRadius:14, padding:'9px 15px', fontWeight:800, fontSize:15, zIndex:2, boxShadow:'0 10px 28px -4px rgba(245,200,74,0.55)' }}>
                ⭐ 4.9
              </div>
            </div>
          </div>
        </div>

        {/* Fade to page background */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:120, background:'linear-gradient(to bottom, transparent, var(--cream))', pointerEvents:'none' }} />
      </section>

      {/* ═══════════════════════════════════════════════════════
          TICKER — scrolling marquee
      ═══════════════════════════════════════════════════════ */}
      <div style={{ background:'var(--accent)', overflow:'hidden', padding:'13px 0', position:'relative', zIndex:1 }}>
        <div className="ticker-inner">
          <span className="ticker-text">{TICKER}</span>
          <span className="ticker-text">{TICKER}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PROMOS — bento grid
      ═══════════════════════════════════════════════════════ */}
      <Sec>
        <Reveal>
          <Head eyebrow="Esta semana" title="promos activas">
            <Link href="/promos" className="more-link" style={moreLink}>ver todas →</Link>
          </Head>
        </Reveal>
        <div className="promos-grid" style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:16 }}>
          <Reveal delay={0} animation="scale-in">
            <Link href="/tienda/slinky-dog" className="promo-tile" style={{ borderRadius:28, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:200, textDecoration:'none', background:'linear-gradient(160deg,#1A1266,#2D1869)', padding:24 }}>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:16, overflow:'hidden' }}>
                <Image src="/assets/posters/slinkydog.jpg" alt="Slinky Dog" width={180} height={180} style={{ objectFit:'contain', opacity:0.9 }} />
              </div>
              <span className="pill danger" style={{ alignSelf:'flex-start', position:'relative', zIndex:1 }}>−17% OFF</span>
              <div style={{ position:'relative', zIndex:1 }}>
                <h3 style={{ fontSize:26, lineHeight:1.0, textTransform:'lowercase', color:'#fff', margin:'0 0 4px', fontWeight:700 }}>slinky dog</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', margin:'0 0 6px' }}>Toy Story · Edición especial</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                  <span style={{ fontSize:22, fontWeight:800, color:'#F5C84A' }}>$750</span>
                  <span style={{ fontSize:14, color:'rgba(255,255,255,0.45)', textDecoration:'line-through' }}>$900</span>
                </div>
              </div>
            </Link>
          </Reveal>
          <Reveal delay={160} animation="scale-in">
            <Link href="/gift-cards" className="promo-tile" style={{ borderRadius:28, overflow:'hidden', position:'relative', display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:200, textDecoration:'none', background:'linear-gradient(160deg, #5526AD, #2A2F7F)', padding:24 }}>
              <Dragon style={{ position:'absolute', right:'-20%', bottom:'-30%', width:'80%', opacity:0.10, color:'#fff' }} />
              <span className="pill gold" style={{ alignSelf:'flex-start', position:'relative', zIndex:1 }}>Gift Cards</span>
              <div style={{ position:'relative', zIndex:1 }}>
                <h3 style={{ fontSize:26, lineHeight:1.0, textTransform:'lowercase', color:'#fff', margin:'0 0 6px', fontWeight:700 }}>regala una figura</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.8)', margin:0 }}>Desde $200 MXN. Envío por correo digital.</p>
              </div>
            </Link>
          </Reveal>
        </div>
      </Sec>

      {/* ═══════════════════════════════════════════════════════
          CATEGORÍAS — horizontal scroll cards
      ═══════════════════════════════════════════════════════ */}
      <Sec top={16}>
        <Reveal><Head eyebrow="Explora" title="por tema" /></Reveal>
        <Reveal delay={80} animation="fade-in">
          <div className="h-scroll-wrap">
            <div className="h-scroll" style={{ gap:12 }}>
              {cats.map(c => {
                const count = allProducts.filter(p => p.cat === c.id).length
                return (
                  <Link key={c.id} href={`/tienda?cat=${c.id}`} className="cat-card" style={{ flexShrink:0, width:134, borderRadius:20, padding:'18px 16px', textDecoration:'none', background:'var(--paper)', border:'1px solid var(--line)', display:'flex', flexDirection:'column', gap:10 }}>
                    <span style={{ width:44, height:44, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={c.icon} size={24} /></span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)', lineHeight:1.2 }}>{c.label}</div>
                      <div style={{ fontSize:11, color:'var(--ink-3)', marginTop:3 }}>{count} figuras</div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </Reveal>
      </Sec>

      {/* ═══════════════════════════════════════════════════════
          NUEVOS INGRESOS — horizontal scroll strip
      ═══════════════════════════════════════════════════════ */}
      <Sec top={0}>
        <Reveal>
          <Head eyebrow="Esta semana" title="nuevos ingresos">
            <Link href="/tienda?tag=nuevo" className="more-link" style={moreLink}>ver todos →</Link>
          </Head>
        </Reveal>
        <Reveal animation="fade-in">
          <div className="h-scroll-wrap">
            <div className="h-scroll" style={{ gap:16 }}>
              {nuevos.map(p => (
                <div key={p.id} style={{ flexShrink:0, width:210 }}>
                  <ProductCard product={p} onView={nav} onAdd={addItem} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Sec>

      {/* ═══════════════════════════════════════════════════════
          RESTOCK — horizontal scroll strip
      ═══════════════════════════════════════════════════════ */}
      <Sec top={0}>
        <Reveal>
          <Head eyebrow="Volvieron" title="restock reciente">
            <Link href="/tienda?tag=restock" className="more-link" style={moreLink}>ver todos →</Link>
          </Head>
        </Reveal>
        <Reveal animation="fade-in">
          <div className="h-scroll-wrap">
            <div className="h-scroll" style={{ gap:16 }}>
              {restock.map(p => (
                <div key={p.id} style={{ flexShrink:0, width:210 }}>
                  <ProductCard product={p} onView={nav} onAdd={addItem} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Sec>

      {/* ═══════════════════════════════════════════════════════
          SETS SELLADOS — 4-col grid
      ═══════════════════════════════════════════════════════ */}
      <Sec top={0}>
        <Reveal>
          <Head eyebrow="Para coleccionistas" title="sets">
            <Link href="/tienda?tipo=set-sealed" className="more-link" style={moreLink}>ver todos →</Link>
          </Head>
        </Reveal>
        <div className="sets-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
          {sets.map((p, i) => (
            <Reveal key={p.id} delay={i * 80} animation="scale-in">
              <ProductCard product={p} onView={nav} onAdd={addItem} />
            </Reveal>
          ))}
          <Reveal delay={sets.length * 80} animation="scale-in">
            <Link href="/vendenos" style={{ background:'linear-gradient(160deg, #5526AD, #2A2F7F)', borderRadius:24, overflow:'hidden', textDecoration:'none', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:28, textAlign:'center', gap:10, color:'#fff', position:'relative', minHeight:280 }}>
              <Dragon style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.08, color:'#fff' }} />
              <Icon name="package" size={36} />
              <h3 style={{ fontSize:24, lineHeight:1.05, textTransform:'lowercase', margin:0, fontWeight:700 }}>¿tienes sets que vender?</h3>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', margin:0 }}>Te ofertamos por todo el lote.</p>
            </Link>
          </Reveal>
        </div>
      </Sec>

      {/* ═══════════════════════════════════════════════════════
          RESEÑAS
      ═══════════════════════════════════════════════════════ */}
      <Sec>
        <Reveal>
          <Head eyebrow="Lo que dicen" title="clientes satisfechos" />
        </Reveal>
        <Reveal animation="fade-up">
          <div className="reviews-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {/* Review card con foto */}
            <div className="review-card" style={{ background:'var(--paper)', border:'1px solid var(--line)', borderRadius:24, overflow:'hidden', display:'grid', gridTemplateColumns:'200px 1fr' }}>
              <div style={{ position:'relative', minHeight:200 }}>
                <Image src="/assets/clientes/review1.jpg" alt="Colección de minifiguras — Edgar Jesús Silva Hernández" fill style={{ objectFit:'cover' }} />
              </div>
              <div style={{ padding:'28px 24px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
                <div>
                  <div style={{ display:'flex', gap:3, marginBottom:14 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color:'#F5C84A', fontSize:18 }}>★</span>
                    ))}
                  </div>
                  <p style={{ fontSize:15, color:'var(--ink)', lineHeight:1.65, margin:'0 0 16px', fontStyle:'italic' }}>
                    &ldquo;Muy contento con la atención y el seguimiento al comprar cada figura, accesibles y siempre con buena comunicación, a día de hoy sigo comprándoles figuras 👌🏻&rdquo;
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'var(--accent)' }}>E</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)' }}>Edgar Jesús Silva Hernández</div>
                    <div style={{ fontSize:11, color:'var(--ink-3)' }}>Cliente verificado · Comprador recurrente</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats de confianza */}
            <div style={{ display:'grid', gridTemplateRows:'1fr 1fr', gap:20 }}>
              <div style={{ background:'linear-gradient(135deg,#5526AD,#2A2F7F)', borderRadius:24, padding:'28px 32px', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                <Dragon style={{ position:'absolute', right:'-10%', bottom:'-20%', width:'50%', opacity:0.08, color:'#fff' }} />
                <div style={{ fontSize:52, fontWeight:900, color:'#F5C84A', letterSpacing:'-0.04em', lineHeight:1 }}>4.9</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.7)', marginTop:6 }}>Calificación promedio · 320+ reseñas</div>
              </div>
              <div style={{ background:'var(--paper)', border:'1px solid var(--line)', borderRadius:24, padding:'28px 32px', display:'flex', gap:32, alignItems:'center' }}>
                {[
                  { v:'1.2k+', label:'figuras vendidas' },
                  { v:'98%',   label:'clientes felices' },
                  { v:'<24h',  label:'tiempo de respuesta' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize:26, fontWeight:800, color:'var(--ink)', letterSpacing:'-0.03em' }}>{s.v}</div>
                    <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:500, marginTop:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Sec>

      {/* ═══════════════════════════════════════════════════════
          BENEFICIOS
      ═══════════════════════════════════════════════════════ */}
      <Sec>
        <div className="benefits-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16 }}>
          {[
            { icon:'truck',   title:'envíos seguros',  desc:'Burbuja + caja rígida. Correos, Estafeta o FedEx.' },
            { icon:'clock',   title:'apartado 40%',    desc:'Aparta con 40% de anticipo y liquida en 7 días.' },
            { icon:'shield',  title:'compra segura',   desc:'MercadoPago, Stripe o transferencia. Garantía 7 días.' },
            { icon:'sparkle', title:'10% off primera', desc:'Con el cupón BIENVENIDA en tu primer pedido.' },
          ].map((b, i) => (
            <Reveal key={b.icon} delay={i * 80} animation="fade-up" style={{ height:'100%' }}>
              <div style={{ height:'100%', background:'var(--paper)', border:'1px solid var(--line)', borderRadius:20, padding:'24px 20px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:'var(--accent-soft)', color:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name={b.icon} size={18} />
                </div>
                <h4 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--ink)' }}>{b.title}</h4>
                <p style={{ margin:0, fontSize:13, color:'var(--ink-2)', lineHeight:1.55 }}>{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Sec>

    </>
  )
}

/* ── Layout helpers ──────────────────────────────────────────── */

function Sec({ children, top = 48, bottom = 0 }: { children: React.ReactNode; top?: number; bottom?: number }) {
  return (
    <section className="sec" style={{ padding:`${top}px 40px ${bottom}px` }}>
      <div style={{ maxWidth:1280, margin:'0 auto' }}>{children}</div>
    </section>
  )
}

function Head({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="sec-head" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, paddingTop:40 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:20, height:2, background:'var(--accent)', borderRadius:1 }} />
          <div className="t-eyebrow">{eyebrow}</div>
        </div>
        <h2 className="sec-title" style={{ margin:0, fontSize:36, fontWeight:800, color:'var(--ink)', textTransform:'capitalize', letterSpacing:'-0.03em', lineHeight:1 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

const moreLink: React.CSSProperties = { fontSize:13, fontWeight:500, color:'var(--ink-2)', textDecoration:'none' }
