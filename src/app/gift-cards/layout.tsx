import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Tarjetas de regalo',
  descripcion: 'Regala minifiguras LEGO: gift cards desde $200 MXN que llegan por correo.',
  ruta: '/gift-cards',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
