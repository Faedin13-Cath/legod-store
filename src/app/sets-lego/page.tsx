import type { Metadata } from 'next'
import Link from 'next/link'
import { getProductsForSeo, shopifyToProduct, isPreventa } from '@/lib/shopify'
import { seo } from '@/lib/seo'
import GridProductos from '@/components/product/GridProductos'
import type { Product } from '@/types'

export const revalidate = 300

async function sets(): Promise<{ sellados: Product[]; usados: Product[] }> {
  const todos = (await getProductsForSeo())
    .map(shopifyToProduct)
    .filter(p => p.type !== 'minifig' && !isPreventa(p))
    .sort((a, b) => Number(a.stock <= 0) - Number(b.stock <= 0))
  return {
    sellados: todos.filter(p => p.type === 'set-sealed'),
    usados:   todos.filter(p => p.type === 'set-used'),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { sellados, usados } = await sets().catch(() => ({ sellados: [], usados: [] }))
  const disp = [...sellados, ...usados].filter(p => p.stock > 0).length
  return seo({
    titulo: 'Sets LEGO sellados y usados en México',
    descripcion: `${disp > 0 ? `${disp} sets disponibles. ` : ''}Sets LEGO originales sellados y de segunda mano: Star Wars, Marvel, El Señor de los Anillos y más. Envíos a todo México desde CDMX.`,
    ruta: '/sets-lego',
  })
}

function Seccion({ titulo, texto, productos }: { titulo: string; texto: string; productos: Product[] }) {
  if (productos.length === 0) return null
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>{titulo}</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: '0 0 18px' }}>{texto}</p>
      <GridProductos productos={productos} />
    </section>
  )
}

export default async function SetsPage() {
  const { sellados, usados } = await sets()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div className="sec" style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 32px 80px' }}>
        <nav aria-label="Ruta" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
          <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Inicio</Link>
          <span>/</span>
          <Link href="/tienda" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}>Tienda</Link>
          <span>/</span>
          <span style={{ color: 'var(--ink)' }}>Sets LEGO</span>
        </nav>

        <header style={{ margin: '28px 0 8px', maxWidth: 720 }}>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Sets LEGO sellados y usados
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--ink-2)', margin: 0 }}>
            Sets LEGO originales, muchos ya descontinuados, sellados de fábrica o de segunda mano.
          </p>
        </header>

        <Seccion titulo="Sellados" texto="En su caja original, sin abrir." productos={sellados} />
        <Seccion titulo="Usados" texto="De segunda mano. El estado de cada uno viene en su ficha." productos={usados} />

        {sellados.length + usados.length === 0 && (
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 24 }}>
            Por ahora no hay sets disponibles. Mira las <Link href="/tienda" style={{ color: 'var(--accent)', fontWeight: 600 }}>minifiguras en la tienda</Link>.
          </p>
        )}
      </div>
    </div>
  )
}
