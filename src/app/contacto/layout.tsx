import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Contacto',
  descripcion: 'Escríbenos por WhatsApp. Estamos en CDMX y enviamos minifiguras LEGO a todo México.',
  ruta: '/contacto',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
