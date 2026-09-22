import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Tienda de minifiguras LEGO originales',
  descripcion: 'Más de 300 minifiguras LEGO originales de Star Wars, Marvel, DC, El Señor de los Anillos y más. Nuevas, usadas y sets sellados, con envío a todo México desde CDMX.',
  ruta: '/tienda',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
