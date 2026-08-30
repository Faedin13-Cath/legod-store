import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/shopify'
import { parsePreventa } from '@/lib/preventa'

const BASE = 'https://www.jangos-store.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/tienda`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/preventas`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/promos`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/gift-cards`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/vendenos`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/contacto`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/envios-devoluciones`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terminos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE}/aviso-privacidad`, changeFrequency: 'yearly', priority: 0.2 },
  ]

  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await getProducts()
    productPages = products
      // Las fichas de preventa no se indexan por separado: no se compran desde
      // ahí y son temporales. /preventas es la página que sí queremos posicionar.
      .filter(p => !parsePreventa(p.tags))
      .map(p => ({
      url: `${BASE}/tienda/${p.handle}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // Si Shopify falla, el sitemap sale solo con las páginas estáticas
  }

  return [...staticPages, ...productPages]
}
