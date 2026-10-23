/**
 * Datos compartidos por las maquetas desechables. Productos, fotos y precios
 * reales de la tienda, para juzgar el diseño con el material de verdad.
 */

export type Figura = { t: string; p: number; img: string; tema: string; nota?: string }

const CDN = 'https://cdn.shopify.com/s/files/1/1012/4443/6789/files/'

export const FIGURAS: Figura[] = [
  { t: 'Darth Maul, brazos rojos impresos', p: 900, tema: 'Star Wars', img: CDN + 'sw0384.png?v=1791321948' },
  { t: 'Taskmaster, capa y capucha blancas', p: 300, tema: 'Marvel', img: CDN + 'sh0100.png?v=1787789994' },
  { t: 'Iron Man, armadura Mark 6', p: 250, tema: 'Marvel', nota: 'Nuevo', img: CDN + 'sh0015.png?v=1790042228' },
  { t: 'Miles Morales con audífonos', p: 150, tema: 'Marvel', nota: 'Nuevo', img: CDN + '76293-14.png?v=1790042310' },
  { t: 'Venom con bufanda y hot dog', p: 120, tema: 'Marvel', img: CDN + '76293-6.png?v=1790042311' },
  { t: 'Storm, Marvel Studios Serie 2', p: 120, tema: 'Marvel', nota: 'Sin accesorios', img: CDN + 'colmar23_15fdb798-3efd-4616-b05f-6daa243270eb.png?v=1791134171' },
  { t: 'Hawkeye, traje blanco', p: 110, tema: 'Marvel', img: CDN + 'sh0570_04ffa12e-764c-4fd7-8ef0-a564a51a5e30.png?v=1787196888' },
  { t: 'Doctor Strange, capa de hule', p: 100, tema: 'Marvel', img: CDN + 'sh0802.png?v=1790042258' },
  { t: 'Ant-Man, traje blanco', p: 100, tema: 'Marvel', img: CDN + 'sh0563_fa945662-9cbc-4648-8dbd-27d966f745df.png?v=1787196887' },
  { t: 'War Machine, traje blanco', p: 90, tema: 'Marvel', img: CDN + 'sh0564_9d69588c-2f04-4c84-89c8-834a40ebb76a.png?v=1787196888' },
  { t: 'Nebula, traje blanco', p: 80, tema: 'Marvel', img: CDN + 'sh0574_012ffa38-72f2-4405-b598-fb2d9af4b905.png?v=1787196887' },
]

export const precio = (n: number) => '$' + n.toLocaleString('es-MX')
