import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Promociones en minifiguras LEGO',
  descripcion: 'Ofertas, códigos de descuento y promociones activas en minifiguras y sets LEGO de Jango\'s Store.',
  ruta: '/promos',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
