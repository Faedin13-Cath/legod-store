import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import CartProvider from '@/components/cart/CartProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  // El dominio sin www redirige al de www: las URLs absolutas (canonical,
  // og:url) van directo al que Google indexa.
  metadataBase: new URL('https://www.jangos-store.com'),
  // Cada sección pone su propio título; la plantilla le agrega la marca.
  // Aquí no va canonical: se heredaría y todas apuntarían a la home.
  title: {
    default: 'Jango\'s Store — Minifiguras LEGO',
    template: '%s | Jango\'s Store',
  },
  description: 'Minifiguras LEGO, sets sellados, segunda mano y customs. Apartados, gift cards y envíos a todo México e internacionales a cotizar.',
  openGraph: {
    title: 'Jango\'s Store — Minifiguras LEGO',
    description: 'Star Wars, Marvel, DC y más. Minifiguras que no consigues en tienda. Apartados, gift cards y envíos a todo México.',
    siteName: 'Jango\'s Store',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jango\'s Store — Minifiguras LEGO',
    description: 'Minifiguras LEGO que no consigues en tienda. Apartados, gift cards y envíos a todo México.',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: "Jango's Store",
  url: 'https://www.jangos-store.com',
  logo: 'https://www.jangos-store.com/assets/logo/legod-logo-violet.png',
  description: 'Minifiguras LEGO, sets sellados, segunda mano y customs. Apartados, gift cards y envíos a todo México.',
  address: { '@type': 'PostalAddress', addressLocality: 'CDMX', addressCountry: 'MX' },
  priceRange: '$$',
  // Le dice a Google que estas cuentas son de la misma tienda: ayuda a que
  // al buscar "jangos" salgan juntas y el sitio arriba.
  sameAs: [
    'https://www.instagram.com/jangos.store/',
    'https://www.tiktok.com/@legod0',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        {/* El catálogo y las fotos vienen de Shopify: abrir la conexión desde
            el principio ahorra ~300 ms en la primera consulta. */}
        <link rel="preconnect" href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}`} crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.shopify.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
