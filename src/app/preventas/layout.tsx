import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Preventas de minifiguras LEGO',
  descripcion: 'Reserva minifiguras LEGO antes de que lleguen: paga completo o en dos partes. Envíos a todo México desde CDMX.',
  ruta: '/preventas',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
