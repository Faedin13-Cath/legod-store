// Precios de envío por paquetería (MXN). Deben coincidir con las tarifas
// configuradas en Shopify (Configuración → Envíos y entrega).
export const SHIPPING_PRICES: Record<string, number> = {
  'Entrega en Rock Show': 0,
  'Estafeta':             160,
  'Correos de México':     75,
  'FedEx':                250,
}

export function shippingCost(carrier?: string): number {
  return SHIPPING_PRICES[carrier ?? ''] ?? 0
}
