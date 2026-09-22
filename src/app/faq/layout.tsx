import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Preguntas frecuentes',
  descripcion: 'Cómo funcionan los apartados, los envíos, los pagos y el estado de las figuras en Jango\'s Store.',
  ruta: '/faq',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
