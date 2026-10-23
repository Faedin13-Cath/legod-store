import type { Metadata } from 'next'
import MockCliente from './MockCliente'

// Maqueta de afinación: copia de la portada real con cuatro arreglos encima,
// para comparar lado a lado sin tocar nada en vivo. No se indexa.
export const metadata: Metadata = {
  title: 'Maqueta · Jango\'s Store',
  robots: { index: false, follow: false },
}

export default function Mock() {
  return <MockCliente />
}
