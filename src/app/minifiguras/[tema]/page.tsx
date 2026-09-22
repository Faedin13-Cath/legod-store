import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProductsForSeo, shopifyToProduct, isPreventa } from '@/lib/shopify'
import {
  CATEGORIAS, MIN_PARA_INDEXAR, categoriaPorSlug, tituloCategoria, type Categoria,
} from '@/lib/categorias'
import { seo } from '@/lib/seo'
import { cats } from '@/lib/data'
import GridProductos from '@/components/product/GridProductos'
import type { Product } from '@/types'

const BASE = 'https://www.jangos-store.com'

// Se arma en el servidor y se refresca cada 5 minutos: altas, bajas y
// cambios de precio se ven sin volver a desplegar.
export const revalidate = 300

export function generateStaticParams() {
  return CATEGORIAS.map(c => ({ tema: c.slug }))
}

async function productosDe(c: Categoria): Promise<Product[]> {
  const todos = (await getProductsForSeo()).map(shopifyToProduct)
  return todos
    // Las preventas se venden solo desde /preventas, igual que en la tienda.
    .filter(p => p.cat === c.cat && !isPreventa(p))
    // Primero lo que se puede comprar; dentro de cada grupo, lo más nuevo.
    .sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0))
}

export async function generateMetadata({ params }: { params: { tema: string } }): Promise<Metadata> {
  const c = categoriaPorSlug(params.tema)
  if (!c) return {}
  const productos = await productosDe(c).catch(() => [] as Product[])
  const disponibles = productos.filter(p => p.stock > 0).length
  const titulo = tituloCategoria(c)
  return {
    ...seo({
      titulo: `${titulo} en México`,
      descripcion: `${disponibles > 0 ? `${disponibles} disponibles. ` : ''}${c.intro} Envíos a todo México desde CDMX y apartado con 60%.`,
      ruta: `/minifiguras/${c.slug}`,
    }),
    // Una categoría casi vacía no le sirve a quien llega desde Google.
    ...(productos.length < MIN_PARA_INDEXAR ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function CategoriaPage({ params }: { params: { tema: string } }) {
  const c = categoriaPorSlug(params.tema)
  if (!c) notFound()

  const productos = await productosDe(c)
  const disponibles = productos.filter(p => p.stock > 0).length
  const titulo = tituloCategoria(c)

  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Tienda', item: `${BASE}/tienda` },
      { '@type': 'ListItem', position: 3, name: titulo, item: `${BASE}/minifiguras/${c.slug}` },
    ],
  }).replace(/</g, '\\u003c')

  // Otros temas con suficiente inventario, para que Google (y la gente)
  // pueda brincar de una categoría a otra.
  const todos = (await getProductsForSeo()).map(shopifyToProduct).filter(p => !isPreventa(p))
  const otros = CATEGORIAS.filter(o =>
    o.slug !== c.slug && todos.filter(p => p.cat === o.cat).length >= MIN_PARA_INDEXAR,
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumb }} />
      <div className="sec" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 80px' }}>
        <nav aria-label="Ruta" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
          <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Inicio</Link>
          <span>/</span>
          <Link href="/tienda" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Tienda</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>{titulo}</span>
        </nav>

        <header style={{ margin: '28px 0 28px', maxWidth: 720 }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {titulo}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', margin: '0 0 10px' }}>{c.intro}</p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {disponibles === 0
              ? 'Por ahora no hay piezas disponibles de este tema.'
              : `${disponibles} ${disponibles === 1 ? 'pieza disponible' : 'piezas disponibles'}`}
            {productos.length > disponibles && ` · ${productos.length - disponibles} agotadas`}
          </p>
        </header>

        {productos.length > 0 ? (
          <GridProductos productos={productos} />
        ) : (
          <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
            Llegan figuras nuevas cada semana. Mientras, date una vuelta por la{' '}
            <Link href="/tienda" style={{ color: 'var(--accent)', fontWeight: 600 }}>tienda completa</Link>.
          </p>
        )}

        {otros.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 14px' }}>Otros temas</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {otros.map(o => (
                <Link key={o.slug} href={`/minifiguras/${o.slug}`} style={{
                  padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  color: 'var(--ink)', background: 'var(--paper)', border: '1px solid var(--line)',
                  textDecoration: 'none',
                }}>
                  {cats.find(x => x.id === o.cat)?.label ?? o.nombre}
                </Link>
              ))}
              <Link href="/sets-lego" style={{
                padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                color: 'var(--ink)', background: 'var(--paper)', border: '1px solid var(--line)',
                textDecoration: 'none',
              }}>
                Sets LEGO
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
