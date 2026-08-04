import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'

const promos = [
  {
    id: 'bancarrota',
    badge: 'OFERTA',
    badgeClass: 'pill danger',
    title: 'Estamos en bancarrota',
    sub: 'Aplica solamente en nuevas pedidos de 5 o más.',
    desc: 'Descuentos de hasta 20% en minifiguras seleccionadas. Ideal para armar tu colección de golpe. Sin código, el descuento se aplica automáticamente al agregar 5+ piezas al carrito.',
    img: '/assets/posters/anuncio-1.png',
    cta: 'Ver productos en oferta',
    href: '/tienda?tag=oferta',
    ends: '30 Jun 2026',
    highlight: true,
  },
  {
    id: 'may-the-4th',
    badge: 'LIMITADA',
    badgeClass: 'pill warn',
    title: 'May the 4th Be With You',
    sub: 'Bundle exclusivo Star Wars Day',
    desc: 'Pack conmemorativo con 4 minifiguras Star Wars seleccionadas. Disponibilidad limitada — solo 1 pack disponible. Incluye Jango Fett, Motti, Mando y una sorpresa galáctica.',
    img: '/assets/posters/social-maythe4th.png',
    cta: 'Ver pack',
    href: '/tienda/maythe4',
    ends: '4 May 2026',
    highlight: false,
  },
  {
    id: 'regalo',
    badge: 'SORTEO',
    badgeClass: 'pill violet',
    title: 'Regala una figura',
    sub: 'Gana $200 MXN en crédito de tienda',
    desc: 'Comparte una foto de tu colección en Instagram con @legodstore y el hashtag #LegodCollection. Cada semana sorteamos $200 MXN en crédito para gastar en la tienda. Sin costo de participación.',
    img: '/assets/posters/banner-sorteo.png',
    cta: 'Ver bases del sorteo',
    href: '#',
    ends: 'Vigente',
    highlight: false,
  },
]

export default function PromosPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 8px' }}>
            SIN DRAMA
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>
            Promos activas
          </h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
            Descuentos, packs y sorteos reales. Sin códigos trampa, sin letra chiquita.
          </p>
        </div>

        {/* Promo cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {promos.map(promo => (
            <div
              key={promo.id}
              style={{
                background: 'var(--paper)',
                border: `1px solid ${promo.highlight ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 20,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '340px 1fr',
              }}
            >
              {/* Image */}
              <div style={{
                position: 'relative', height: 260,
                background: 'var(--cream-2)',
                overflow: 'hidden',
              }}>
                <Image
                  src={promo.img}
                  alt={promo.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>

              {/* Content */}
              <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span className={promo.badgeClass}>{promo.badge}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>
                      <Icon name="clock" size={11} /> Vigencia: {promo.ends}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>{promo.title}</h2>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{promo.sub}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-2)', margin: 0, maxWidth: 520 }}>{promo.desc}</p>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Link
                    href={promo.href}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', textDecoration: 'none', fontSize: 14 }}
                  >
                    {promo.cta}
                    <Icon name="chevron-right" size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div style={{
          marginTop: 48, padding: '40px',
          background: 'var(--accent-soft)', borderRadius: 20,
          border: '1px solid var(--accent)',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
            ¿No quieres perderte ninguna promo?
          </h3>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 20px' }}>
            Suscríbete y te avisamos primero — por email o WhatsApp.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
            <input
              type="email"
              placeholder="tu@email.com"
              className="input"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Suscribirme
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
