/**
 * Recorta el fondo blanco de las fotos de producto y las guarda con
 * transparencia real en public/recortes/.
 *
 * Por qué no basta con "todo píxel blanco a transparente": hay figuras
 * blancas (Moon Knight, los trajes blancos de Marvel). Un borrado global
 * les haría agujeros. Esto hace relleno por inundación desde los bordes:
 * sólo desaparece el blanco que está conectado con la orilla, que es el
 * fondo. El blanco de adentro de la figura se queda.
 *
 *   node scripts/recortar-fondo.mjs [--solo] <url|archivo> [más...]
 *
 * --solo: deja únicamente la figura más grande y borra las piezas sueltas
 *         (cabezas y caras de repuesto) que vienen al lado en varias fotos.
 */
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const SALIDA = 'public/recortes'
/** Qué tan lejos del blanco puro sigue contando como fondo. Las fotos traen
 *  compresión JPEG, así que el "blanco" nunca es 255 exacto. */
const TOLERANCIA = 18
/** Los píxeles del borde de la silueta quedan a medias entre figura y fondo.
 *  Se les baja el alfa en proporción para que no quede un halo blanco. */
const SUAVIZADO = 42

async function bytes(origen) {
  if (/^https?:/.test(origen)) {
    const r = await fetch(origen)
    if (!r.ok) throw new Error(`${r.status} al bajar ${origen}`)
    return Buffer.from(await r.arrayBuffer())
  }
  return (await import('node:fs/promises')).readFile(origen)
}

async function recortar(origen, nombre) {
  const img = sharp(await bytes(origen)).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: c } = info

  const esFondo = i => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    return 255 - Math.min(r, g, b) <= TOLERANCIA
  }

  // Inundación desde las cuatro orillas, en 4 direcciones, con pila propia
  // (la recursión se desborda con fotos de 1000px).
  const fuera = new Uint8Array(w * h)
  const pila = []
  for (let x = 0; x < w; x++) { pila.push(x, (h - 1) * w + x) }
  for (let y = 0; y < h; y++) { pila.push(y * w, y * w + w - 1) }

  while (pila.length) {
    const p = pila.pop()
    if (fuera[p] || !esFondo(p * c)) continue
    fuera[p] = 1
    const x = p % w, y = (p - x) / w
    if (x > 0)     pila.push(p - 1)
    if (x < w - 1) pila.push(p + 1)
    if (y > 0)     pila.push(p - w)
    if (y < h - 1) pila.push(p + w)
  }

  let borrados = 0
  for (let p = 0; p < w * h; p++) {
    const i = p * c
    if (fuera[p]) { data[i + 3] = 0; borrados++; continue }
    // Semitransparencia en la orilla: si el píxel es casi fondo y toca uno
    // que sí lo es, se desvanece en vez de cortarse a navaja.
    const claridad = 255 - Math.min(data[i], data[i + 1], data[i + 2])
    if (claridad >= TOLERANCIA && claridad < SUAVIZADO) {
      const x = p % w, y = (p - x) / w
      const vecinoFuera =
        (x > 0     && fuera[p - 1]) || (x < w - 1 && fuera[p + 1]) ||
        (y > 0     && fuera[p - w]) || (y < h - 1 && fuera[p + w])
      if (vecinoFuera) {
        const t = (claridad - TOLERANCIA) / (SUAVIZADO - TOLERANCIA)
        data[i + 3] = Math.round(data[i + 3] * t)
      }
    }
  }

  // Varias fotos del catálogo traen piezas sueltas al lado de la figura: una
  // cabeza de repuesto, una cara alterna, otro peinado. Dentro del rectángulo
  // blanco no se notaban; ya recortadas quedan flotando al aire. Con --solo nos
  // quedamos con la mancha más grande, que siempre es la figura completa.
  if (soloFigura) {
    const etiqueta = new Int32Array(w * h).fill(-1)
    let mejor = -1, mejorTam = 0
    for (let semilla = 0; semilla < w * h; semilla++) {
      if (fuera[semilla] || etiqueta[semilla] !== -1) continue
      let tam = 0
      const cola = [semilla]
      etiqueta[semilla] = semilla
      while (cola.length) {
        const p = cola.pop(); tam++
        const x = p % w, y = (p - x) / w
        if (x > 0     && !fuera[p - 1] && etiqueta[p - 1] === -1) { etiqueta[p - 1] = semilla; cola.push(p - 1) }
        if (x < w - 1 && !fuera[p + 1] && etiqueta[p + 1] === -1) { etiqueta[p + 1] = semilla; cola.push(p + 1) }
        if (y > 0     && !fuera[p - w] && etiqueta[p - w] === -1) { etiqueta[p - w] = semilla; cola.push(p - w) }
        if (y < h - 1 && !fuera[p + w] && etiqueta[p + w] === -1) { etiqueta[p + w] = semilla; cola.push(p + w) }
      }
      if (tam > mejorTam) { mejorTam = tam; mejor = semilla }
    }
    for (let p = 0; p < w * h; p++) {
      if (!fuera[p] && etiqueta[p] !== mejor) { data[p * c + 3] = 0; borrados++ }
    }
  }

  const png = await sharp(data, { raw: { width: w, height: h, channels: c } })
    .png({ compressionLevel: 9 })
    .trim()           // recorta el aire transparente que quedó alrededor
    .toBuffer()

  await writeFile(`${SALIDA}/${nombre}.png`, png)
  const pct = ((borrados / (w * h)) * 100).toFixed(1)
  console.log(`${nombre}.png  ${w}x${h}  fondo borrado: ${pct}%  ${(png.length / 1024).toFixed(0)} KB`)
}

const args       = process.argv.slice(2)
const soloFigura = args.includes('--solo')
const origenes   = args.filter(a => a !== '--solo')
if (!origenes.length) { console.error('Uso: node scripts/recortar-fondo.mjs [--solo] <url|archivo>...'); process.exit(1) }
await mkdir(SALIDA, { recursive: true })
for (const o of origenes) {
  const nombre = basename(new URL(o, 'file:///').pathname).replace(/\.[a-z]+$/i, '')
  try { await recortar(o, nombre) }
  catch (e) { console.error(`FALLÓ ${nombre}: ${e.message}`) }
}
