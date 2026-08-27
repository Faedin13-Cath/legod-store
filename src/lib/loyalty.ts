/**
 * Fuente única de verdad del programa de lealtad.
 * Antes esta lógica estaba duplicada en 4 archivos y se desincronizaba:
 * los puntos salían distintos según si pagabas con saldo o con tarjeta.
 */

/** Puntos necesarios para $1 MXN de saldo. */
export const PTS_PER_MXN = 10

/** Niveles. Se determinan por `points_lifetime`, que nunca baja al canjear. */
export const TIERS = [
  {
    id: 'padawan', label: 'Padawan', emoji: '⭐',
    min: 0, max: 999, rate: 1 / 5,
    color: '#A0896C', bg: '#A0896C14',
    earnLabel: '1 pto × cada $5 MXN',
    benefits: ['1 punto por cada $5 MXN', 'Acceso a preventas', 'Historial de compras'],
  },
  {
    id: 'jedi', label: 'Caballero Jedi', emoji: '💙',
    min: 1000, max: 4999, rate: 1 / 4,
    color: '#3B82F6', bg: '#3B82F614',
    earnLabel: '1 pto × cada $4 MXN',
    benefits: ['1 punto por cada $4 MXN', 'Acceso prioritario a drops', 'Todo lo de Padawan'],
  },
  {
    id: 'maestro', label: 'Maestro Jedi', emoji: '🔮',
    min: 5000, max: Infinity, rate: 1 / 3,
    color: '#7C3AED', bg: '#7C3AED14',
    earnLabel: '1 pto × cada $3 MXN',
    benefits: ['1 punto por cada $3 MXN', 'Preventa exclusiva', 'Todo lo de Caballero Jedi'],
  },
] as const

/** Recompensas canjeables. El servidor SOLO acepta valores de esta tabla. */
export const REWARDS = [
  { pts: 500,  saldo: 50,  ship: false, label: '$50 MXN en saldo',                    sublabel: 'Se acredita a tu cartera al instante' },
  { pts: 1500, saldo: 150, ship: false, label: '$150 MXN en saldo',                   sublabel: 'Se acredita a tu cartera al instante' },
  { pts: 4000, saldo: 400, ship: false, label: '$400 MXN en saldo',                   sublabel: 'Se acredita a tu cartera al instante' },
  { pts: 8000, saldo: 800, ship: true,  label: '$800 MXN en saldo + figura sorpresa', sublabel: 'Acreditamos el saldo y te contactamos para enviarte la figura' },
] as const

export const THRESHOLDS = REWARDS.map(r => r.pts)

/** Nivel según puntos de por vida. */
export function getTier(lifetime: number) {
  return [...TIERS].reverse().find(t => lifetime >= t.min) ?? TIERS[0]
}

/** Puntos ganados por MXN, según el nivel alcanzado. */
export function earnRate(lifetime: number): number {
  return getTier(lifetime).rate
}

/** Puntos que otorga una compra de `amount` MXN. */
export function pointsFor(amount: number, lifetime: number): number {
  return Math.floor(amount * earnRate(lifetime))
}

/** Siguiente recompensa alcanzable, o 0 si ya pasó todas. */
export function nextReward(spendable: number): number {
  return THRESHOLDS.find(t => t > spendable) ?? 0
}

/** Busca una recompensa por su costo en puntos. Devuelve null si no existe. */
export function findReward(pts: number) {
  return REWARDS.find(r => r.pts === pts) ?? null
}

/** Progreso hacia el siguiente nivel. */
export function tierProgress(lifetime: number) {
  const tier = getTier(lifetime)
  const next = TIERS.find(t => t.min > lifetime)
  if (!next) return { pct: 100, remaining: 0, next: null }
  const range = next.min - tier.min
  return {
    pct:       Math.round(((lifetime - tier.min) / range) * 100),
    remaining: next.min - lifetime,
    next,
  }
}

/* ────────────────────────────────────────────────────────────── */

type Db = {
  from: (t: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Otorga los puntos de una compra. Usado por el webhook de Shopify,
 * el checkout con saldo completo y la liquidación de apartados —
 * los tres tienen que calcular exactamente lo mismo.
 *
 * El llamador es responsable de verificar la idempotencia (order_id)
 * antes de invocar esto.
 */
export async function awardPurchasePoints(
  db: Db,
  opts: { userId: string; amount: number; description: string; orderId: string },
) {
  const { userId, amount, description, orderId } = opts

  const { data: prof } = await db
    .from('profiles')
    .select('points_total, points_lifetime')
    .eq('id', userId)
    .single()

  const spendable = prof?.points_total    ?? 0
  const lifetime  = prof?.points_lifetime ?? spendable

  const earned = pointsFor(amount, lifetime)

  // Siempre insertamos la fila de compra: es la marca de idempotencia
  await db.from('points_history').insert({
    user_id: userId, points: earned, type: 'purchase', description, order_id: orderId,
  })

  if (earned > 0) {
    const newSpendable = spendable + earned
    await db.from('profiles').update({
      points_total:       newSpendable,
      points_lifetime:    lifetime + earned,
      points_next_reward: nextReward(newSpendable),
    }).eq('id', userId)
  }

  return { earned, total: earned }
}
