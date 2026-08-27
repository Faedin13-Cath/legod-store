import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import CartProvider from '@/components/cart/CartProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  metadataBase: new URL('https://jangos-store.com'),
  title: 'Jango\'s Store — Minifiguras LEGO',
  description: 'Minifiguras LEGO, sets sellados, segunda mano y customs. Apartados, gift cards y envíos a todo México e internacionales a cotizar.',
  openGraph: {
    title: 'Jango\'s Store — Minifiguras LEGO',
    description: 'Star Wars, Marvel, DC y más. Minifiguras que no consigues en tienda. Apartados, gift cards y envíos a todo México.',
    url: 'https://jangos-store.com',
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
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
