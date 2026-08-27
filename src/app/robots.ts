import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/perfil', '/login', '/coleccion', '/wishlist', '/apartados', '/saldo', '/lealtad', '/alertas', '/pedidos'],
      },
    ],
    sitemap: 'https://www.jangos-store.com/sitemap.xml',
  }
}
