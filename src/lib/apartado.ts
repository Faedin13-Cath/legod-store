/**
 * Apartados — reservar una figura pagando una parte hoy y el resto en un plazo.
 *
 * El porcentaje vivía repetido en nueve archivos (checkout, carrito, ficha de
 * producto, portada, términos y la página de apartados). Cambiarlo obligaba a
 * cazarlos todos y bastaba con olvidar uno para que la tienda prometiera un
 * número y cobrara otro.
 */

/** Parte del total que se paga al apartar; el resto va al liquidar. */
export const APARTADO_PCT = 0.60

/** "60%", ya listo para escribirlo en la interfaz. */
export const APARTADO_LABEL = `${Math.round(APARTADO_PCT * 100)}%`

/**
 * Anticipo de una figura, en pesos enteros.
 *
 * Se redondea por renglón y no sobre el total para que la suma de lo que ve
 * el cliente en el desglose sea exactamente lo que se le cobra. Con el total
 * redondeado aparte, un apartado de tres figuras podía cerrar con un peso de
 * diferencia entre la nota y el cargo.
 */
export const anticipoDe = (precio: number) => Math.round(precio * APARTADO_PCT)

/** Anticipo de un carrito: la suma de los anticipos por renglón. */
export function anticipoTotal(items: { price: number; qty: number }[]) {
  return items.reduce((s, i) => s + anticipoDe(i.price) * i.qty, 0)
}
