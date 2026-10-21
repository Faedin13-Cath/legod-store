import type { Metadata } from 'next'
import { seo } from '@/lib/seo'

// La página es de cliente y no puede declarar metadatos; van aquí.
export const metadata: Metadata = seo({
  titulo: 'Datos de pago',
  descripcion: 'CLABE y datos para pagar tu pedido por transferencia SPEI en Jango\'s Store.',
  ruta: '/pago',
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
