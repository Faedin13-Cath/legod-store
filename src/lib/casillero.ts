import { CASILLERO } from '@/lib/shipping'

type Db = {
  from: (t: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type PiezaGuardada = { name: string; qty: number; price?: number }

/**
 * Deja unas figuras esperando en el casillero del cliente.
 *
 * Se usa cuando una preventa queda lista para salir: ya llegó y ya está
 * pagada, pero el cliente todavía no pide el envío. Entra como un pedido
 * más para que se pueda juntar con sus otras compras en una sola caja.
 *
 * `referencia` hace la operación idempotente: si el webhook se repite (y
 * Shopify los reintenta), no se duplica la fila.
 */
export async function guardarEnCasillero(
  db: Db,
  opts: { userId: string; piezas: PiezaGuardada[]; referencia: string; numero?: string },
) {
  const { userId, piezas, referencia, numero } = opts
  if (!piezas.length) return

  await db.from('orders').upsert({
    user_id:            userId,
    shopify_order_id:   referencia,
    order_number:       numero ?? referencia,
    total_price:        0,
    financial_status:   'paid',
    fulfillment_status: 'unfulfilled',
    carrier:            CASILLERO,
    line_items:         piezas.map(p => ({
      title: p.name, quantity: p.qty, price: String(p.price ?? 0),
    })),
    created_at:         new Date().toISOString(),
  }, { onConflict: 'shopify_order_id' })
}
