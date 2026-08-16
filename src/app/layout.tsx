import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import CartProvider from '@/components/cart/CartProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'

export const metadata: Metadata = {
  title: 'Jango\'s Store — Minifiguras LEGO',
  description: 'Minifiguras LEGO, sets sellados, segunda mano y customs. Apartados, gift cards y envíos a todo México e internacionales a cotizar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
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
