import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import CartProvider from '@/components/cart/CartProvider'

export const metadata: Metadata = {
  title: 'LEGOD — Minifiguras LEGO · Jango\'s Store',
  description: 'Minifiguras LEGO, sets sellados, segunda mano y customs. Apartados, gift cards y envíos a todo México.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
