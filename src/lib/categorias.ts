import type { ProductCat } from '@/types'

/**
 * Páginas de categoría: una URL fija por tema (/minifiguras/star-wars) que
 * Google puede posicionar para búsquedas como "minifiguras lego star wars".
 * Los filtros de la tienda (/tienda?cat=starwars) siguen igual para navegar.
 */
export type Categoria = {
  cat: ProductCat
  slug: string
  /** Como se nombra en títulos: "Minifiguras LEGO de {nombre}". */
  nombre: string
  /** Un par de líneas propias de la página, para que no sea solo una reja. */
  intro: string
}

export const CATEGORIAS: Categoria[] = [
  { cat: 'starwars', slug: 'star-wars', nombre: 'Star Wars',
    intro: 'Clones, Jedi, Sith, cazarrecompensas y soldados del Imperio: minifiguras LEGO originales de Star Wars, de las trilogías, The Clone Wars y las series.' },
  { cat: 'marvel', slug: 'marvel', nombre: 'Marvel',
    intro: 'Vengadores, X-Men, Spider-Man y villanos: minifiguras LEGO originales de Marvel, desde las primeras películas hasta los lanzamientos más recientes.' },
  { cat: 'dc', slug: 'dc', nombre: 'DC',
    intro: 'Batman, el Joker, la Liga de la Justicia y más: minifiguras LEGO originales de DC.' },
  { cat: 'lotr', slug: 'el-senor-de-los-anillos', nombre: 'El Señor de los Anillos',
    intro: 'Hobbits, enanos, elfos y orcos de El Señor de los Anillos y El Hobbit: minifiguras LEGO originales, muchas ya fuera de producción.' },
  { cat: 'harry', slug: 'harry-potter', nombre: 'Harry Potter',
    intro: 'Magos, brujas y criaturas del mundo mágico: minifiguras LEGO originales de Harry Potter.' },
  { cat: 'stranger', slug: 'stranger-things', nombre: 'Stranger Things',
    intro: 'Personajes de Hawkins y del Upside Down: minifiguras LEGO originales de Stranger Things.' },
  { cat: 'ninjago', slug: 'ninjago', nombre: 'Ninjago',
    intro: 'Ninjas, maestros y villanos: minifiguras LEGO originales de Ninjago.' },
  { cat: 'city', slug: 'city', nombre: 'City',
    intro: 'Astronautas, bomberos, policías y todos los oficios de la ciudad: minifiguras LEGO City originales.' },
  { cat: 'series', slug: 'series-coleccionables', nombre: 'las series coleccionables',
    intro: 'Figuras de las series de sobres sorpresa de LEGO (Collectible Minifigures), cada una con sus accesorios.' },
  { cat: 'castle', slug: 'castle', nombre: 'Castle',
    intro: 'Caballeros, reyes y soldados medievales: minifiguras LEGO Castle originales.' },
  { cat: 'espacio', slug: 'espacio', nombre: 'espacio',
    intro: 'Astronautas y exploradores espaciales: minifiguras LEGO originales de temas de espacio.' },
  { cat: 'animales', slug: 'animales', nombre: 'animales',
    intro: 'Animales y criaturas LEGO originales para completar tus escenas.' },
  { cat: 'pixar', slug: 'pixar', nombre: 'Pixar',
    intro: 'Personajes de Toy Story y otras películas de Pixar en minifigura LEGO original.' },
  { cat: 'sports', slug: 'deportes', nombre: 'deportes',
    intro: 'Futbolistas y atletas: minifiguras LEGO originales de temas deportivos.' },
  { cat: 'piratas', slug: 'piratas', nombre: 'piratas',
    intro: 'Capitanes, corsarios y tripulaciones: minifiguras LEGO originales de piratas.' },
  { cat: 'aventureros', slug: 'aventureros', nombre: 'aventureros',
    intro: 'Exploradores y aventureros: minifiguras LEGO originales de temas de aventura.' },
  { cat: 'peliculas', slug: 'peliculas', nombre: 'películas',
    intro: 'Personajes de películas en minifigura LEGO original.' },
  { cat: 'videojuegos', slug: 'videojuegos', nombre: 'videojuegos',
    intro: 'Personajes de videojuegos en minifigura LEGO original.' },
  { cat: 'bionicle', slug: 'bionicle', nombre: 'Bionicle',
    intro: 'Figuras LEGO Bionicle originales.' },
  { cat: 'piezas', slug: 'piezas-y-accesorios', nombre: 'piezas y accesorios',
    intro: 'Piezas sueltas, armas y accesorios LEGO originales para completar o mejorar tus figuras.' },
  { cat: 'custom', slug: 'custom', nombre: 'custom',
    intro: 'Minifiguras personalizadas: diseños que LEGO no fabrica, hechos con piezas compatibles. No son producto oficial LEGO.' },
]

/** Con menos productos que esto la página no se indexa ni va al sitemap:
 *  una categoría con una sola figura no le aporta nada a quien busca. */
export const MIN_PARA_INDEXAR = 4

export const categoriaPorSlug = (slug: string) => CATEGORIAS.find(c => c.slug === slug)
export const categoriaPorCat = (cat: string) => CATEGORIAS.find(c => c.cat === cat)

/** "Minifiguras LEGO de Star Wars" / "Minifiguras custom". */
export function tituloCategoria(c: Categoria): string {
  if (c.cat === 'custom') return 'Minifiguras custom'
  if (c.cat === 'piezas') return 'Piezas y accesorios LEGO'
  return `Minifiguras LEGO de ${c.nombre}`
}
