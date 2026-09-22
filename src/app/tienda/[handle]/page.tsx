import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductForSeo, shopifyToProduct } from '@/lib/shopify'
import { seo } from '@/lib/seo'
import { titulo, descripcion, tema, precioVisible } from '@/lib/producto-seo'
import type { Product } from '@/types'
import ProductoCliente from './ProductoCliente'

const BASE = 'https://www.jangos-store.com'

// La ficha se arma en el servidor y queda en caché 5 minutos: Google recibe
// nombre, precio y foto en el HTML en vez de un "Cargando…".
export const revalidate = 300
// Ninguna ficha se arma en el build (serían cientos): cada una se genera la
// primera vez que alguien la pide y de ahí sale de la caché.
export function generateStaticParams() {
  return []
}

/** null = el producto no existe. Si Shopify falla, lanza: así no se guarda en
 *  caché un 404 falso por cinco minutos. */
async function cargar(handle: string): Promise<Product | null> {
  const p = await getProductForSeo(handle)
  return p ? shopifyToProduct(p) : null
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const p = await cargar(params.handle).catch(() => undefined)
  if (p === undefined) return {}   // falló Shopify: se quedan los del sitio
  if (!p) return { title: 'Producto no encontrado', robots: { index: false } }

  return {
    ...seo({
      titulo: titulo(p),
      descripcion: descripcion(p),
      ruta: `/tienda/${params.handle}`,
      ...(p.photo ? { imagen: { url: p.photo, alt: p.name } } : {}),
    }),
    // Las preventas se compran desde /preventas y son temporales; el sitemap
    // ya las deja fuera.
    ...(p.preventa ? { robots: { index: false, follow: true } } : {}),
  }
}

/** Datos estructurados para que Google pueda mostrar precio y disponibilidad. */
function jsonLd(p: Product, handle: string) {
  const url = `${BASE}/tienda/${handle}`
  const disponibilidad = p.preventa
    ? 'https://schema.org/PreOrder'
    : p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const condicion = p.state === 'usado' || p.state === 'crack'
    ? 'https://schema.org/UsedCondition'
    : 'https://schema.org/NewCondition'

  const offers = p.variants
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'MXN',
        lowPrice:  Math.min(...p.variants.map(v => v.price)),
        highPrice: Math.max(...p.variants.map(v => v.price)),
        offerCount: p.variants.length,
        availability: disponibilidad,
        url,
      }
    : {
        '@type': 'Offer',
        priceCurrency: 'MXN',
        price: precioVisible(p),
        availability: disponibilidad,
        itemCondition: condicion,
        url,
        seller: { '@type': 'Organization', name: "Jango's Store" },
      }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: descripcion(p),
    sku: p.blId ?? handle,
    ...(p.photo ? { image: [p.photo] } : {}),
    // Una custom no es de LEGO: no se anuncia con su marca.
    ...(p.cat !== 'custom' ? { brand: { '@type': 'Brand', name: 'LEGO' } } : {}),
    ...(tema(p) ? { category: tema(p) } : {}),
    offers,
  }
}

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const p = await cargar(params.handle)
  if (!p) notFound()

  // `<` escapado: un título con "</script>" no puede cortar la etiqueta.
  const ld = JSON.stringify(jsonLd(p, params.handle)).replace(/</g, '\\u003c')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      <ProductoCliente handle={params.handle} initial={p} />
    </>
  )
}
