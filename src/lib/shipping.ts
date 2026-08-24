// Precios de envío por paquetería (MXN). "Recoger en tienda" es gratis.
export const SHIPPING_PRICES: Record<string, number> = {
  'Recoger en tienda': 0,
  'Estafeta':          165,
  'Correos de México':  75,
  'FedEx':             220,
}

export function shippingCost(carrier?: string): number {
  return SHIPPING_PRICES[carrier ?? ''] ?? 0
}
