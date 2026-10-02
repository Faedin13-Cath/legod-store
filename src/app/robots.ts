import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // /fotos-ml/ son las fotos para el catálogo de Mercado Libre: deben
        // estar accesibles por URL, pero no son parte del sitio ni se indexan.
        disallow: ['/api/', '/admin', '/perfil', '/login', '/coleccion', '/wishlist', '/apartados', '/saldo', '/lealtad', '/alertas', '/pedidos', '/fotos-ml/'],
      },
    ],
    sitemap: 'https://www.jangos-store.com/sitemap.xml',
  }
}
