// Lógica del formulario de entregas: reconocer al cliente por su celular y
// mostrarle sus datos guardados sin regalarlos completos.

/**
 * Deja solo los 10 dígitos del celular. La gente lo escribe con espacios,
 * guiones, +52, el 1 viejo o la lada 044/045, y el teléfono es lo que
 * identifica al cliente, así que todas esas formas tienen que dar el mismo
 * resultado. Devuelve null si no queda un celular de 10 dígitos.
 */
export function normalizarTelefono(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3)
  else if (d.length === 13 && (d.startsWith('044') || d.startsWith('045'))) d = d.slice(3)
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2)
  return d.length === 10 ? d : null
}

const PUNTO = '•'

/** Muestra el primer carácter y tapa el resto. */
function taparResto(s: string): string {
  return s ? s[0] + PUNTO.repeat(s.length - 1) : ''
}

// Se ve la calle para reconocerla, pero el número exterior va tapado.
export function enmascararCalle(calle: string, numExt: string): string {
  return [calle, taparResto(numExt)].filter(Boolean).join(' ')
}

export function enmascararColonia(colonia: string): string {
  return taparResto(colonia)
}

// Quedan visibles las dos primeras cifras y la última.
export function enmascararCP(cp: string): string {
  if (cp.length < 4) return taparResto(cp)
  return cp.slice(0, 2) + PUNTO.repeat(cp.length - 3) + cp.slice(-1)
}

// Los puntos son siempre tres para no revelar cuánto mide el correo.
export function enmascararEmail(email: string): string {
  const arroba = email.lastIndexOf('@')
  if (arroba < 1) return ''
  return email.slice(0, Math.min(3, arroba)) + PUNTO.repeat(3) + email.slice(arroba)
}

export type ContactoEnmascarado = {
  nombre: string
  calle: string
  colonia: string
  cp: string
  email: string
  tieneDireccion: boolean
}

/**
 * IP del visitante, para limitar intentos. x-forwarded-for lo puede escribir
 * el cliente, así que se usa al final: primero los encabezados que Vercel
 * pone él mismo (x-vercel-forwarded-for, x-real-ip) y que el cliente no puede falsear.
 */
export function ipDe(headers: Headers): string {
  const vercel = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  if (vercel) return vercel
  const real = headers.get('x-real-ip')?.trim()
  if (real) return real
  const reenviada = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (reenviada) return reenviada
  return 'desconocida'
}

/**
 * Monto que el cliente aún debe. Solo dígitos con hasta dos decimales:
 * "como $100" o "-50" se rechazan en lugar de adivinar, porque es dinero
 * que el dueño va a cobrar en mano. Devuelve null si no es un monto válido.
 */
export function validarResta(raw: string): number | null {
  const s = raw.trim()
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null
  return Number(s)
}

const MAX_PIEZAS = 5000

/**
 * Lista de piezas tal como la pegó el cliente. Se recortan solo las orillas;
 * los saltos de línea de en medio se conservan porque cada renglón es una
 * figura. Devuelve null si queda vacía o pasa del tope.
 */
export function validarPiezas(raw: string): string | null {
  const s = raw.trim()
  if (!s || s.length > MAX_PIEZAS) return null
  return s
}
