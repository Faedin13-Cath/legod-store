import type { Metadata } from 'next'
import { seo } from '@/lib/seo'
import HomeCliente from './HomeCliente'

export const metadata: Metadata = seo({
  titulo: 'Minifiguras LEGO en México — Star Wars, Marvel y más | Jango\'s Store',
  absoluto: true,
  descripcion: 'Tienda de minifiguras LEGO originales en CDMX: Star Wars, Marvel, DC, El Señor de los Anillos y más. Sets sellados, figuras de segunda mano, apartados con 60% y envíos a todo México.',
  ruta: '/',
})

export default function Home() {
  return <HomeCliente />
}
