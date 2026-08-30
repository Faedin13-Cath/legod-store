// Precios de envío por paquetería (MXN). Deben coincidir con las tarifas
// configuradas en Shopify (Configuración → Envíos y entrega).

/**
 * El cliente no se lleva la figura todavía: la guardamos y se la mandamos
 * junto con lo que compre después, pagando el envío una sola vez. El nombre
 * tiene que ser idéntico a la tarifa en Shopify o el pedido no se reconoce
 * como guardado.
 */
export const CASILLERO = 'Guardar en mi casillero'

export const SHIPPING_PRICES: Record<string, number> = {
  'Entrega en Rock Show': 0,
  [CASILLERO]:            0,
  'Estafeta':             160,
  'Correos de México':     75,
  'FedEx':                250,
}

export function shippingCost(carrier?: string): number {
  return SHIPPING_PRICES[carrier ?? ''] ?? 0
}

/** Paqueterías reales, sin las opciones que no mueven el paquete todavía. */
export const CARRIERS_ENVIO = ['Estafeta', 'Correos de México', 'FedEx'] as const

export function esCasillero(carrier?: string | null): boolean {
  return carrier === CASILLERO
}
