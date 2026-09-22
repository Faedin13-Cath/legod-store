import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Vende tus minifiguras LEGO',
  descripcion: '¿Tienes minifiguras o sets LEGO que ya no usas? Mándanos fotos, te hacemos una cotización y te pagamos el mismo día en efectivo o transferencia.',
  ruta: '/vendenos',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
