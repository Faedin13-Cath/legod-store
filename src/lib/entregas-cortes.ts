/**
 * Cortes semanales del dueño. Son solo informativos: al cliente nunca se le
 * bloquea nada, si llega después del corte su pedido sale en el siguiente lote.
 *
 *  - Envíos: cierran los miércoles a las 10:00 p. m.
 *  - Rock Show: cierra los viernes a las 3:00 p. m.
 *
 * El corte es hora de la Ciudad de México, no la del servidor (UTC en Vercel) ni
 * la del visitante. Se lee la hora de pared de esa zona con Intl, así que no hay
 * ningún -6 escrito a mano y un cambio de horario del país no rompería nada.
 */

export type TipoCorte = 'envio' | 'rock_show'

export const ZONA_CORTES = 'America/Mexico_City'

// Lunes = 0 … domingo = 6. La semana de pedidos va de lunes a domingo.
const CORTES: Record<TipoCorte, { dia: number; hora: number; minuto: number }> = {
  envio: { dia: 2, hora: 22, minuto: 0 },      // miércoles 10:00 p. m.
  rock_show: { dia: 4, hora: 15, minuto: 0 },  // viernes 3:00 p. m.
}

const DIAS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

export type EstadoCorte = {
  /** true: todavía entra en el lote de esta semana. false: ya es del siguiente. */
  dentro: boolean
  /** Día en que cierra el lote, p. ej. "miércoles". */
  diaCierre: string
  /** Hora de cierre, p. ej. "10:00 p. m.". */
  horaCierre: string
  /** Fecha del cierre del lote en el que cae el pedido, p. ej. "miércoles 21 de octubre". */
  fechaCierre: string
}

/** Fecha y hora de pared en la Ciudad de México para un instante dado. */
function pared(ahora: Date) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_CORTES, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(ahora)
  const v = (t: string) => partes.find(p => p.type === t)?.value ?? ''
  return {
    dia: DIAS[v('weekday')] ?? 0,
    anio: Number(v('year')), mes: Number(v('month')), diaMes: Number(v('day')),
    minutoDelDia: (Number(v('hour')) % 24) * 60 + Number(v('minute')),
  }
}

export function estadoCorte(tipo: TipoCorte, ahora: Date = new Date()): EstadoCorte {
  const c = CORTES[tipo]
  const p = pared(ahora)
  const corte = c.hora * 60 + c.minuto
  // Exactamente a la hora del corte ya cerró: 9:59 p. m. entra, 10:00 p. m. no.
  const dentro = p.dia < c.dia || (p.dia === c.dia && p.minutoDelDia < corte)

  // El lote al que cae: el de esta semana si está dentro, si no el de la siguiente.
  const dias = c.dia - p.dia + (dentro ? 0 : 7)
  // Aritmética de calendario sobre la fecha de pared; se formatea en UTC para que
  // la zona de quien ejecuta no mueva el día.
  const fecha = new Date(Date.UTC(p.anio, p.mes - 1, p.diaMes + dias, 12))
  const fechaCierre = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  }).format(fecha)
  const diaCierre = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', weekday: 'long' }).format(fecha)
  const horaCierre = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(Date.UTC(2000, 0, 1, c.hora, c.minuto)))

  return { dentro, diaCierre, horaCierre, fechaCierre: fechaCierre.replace(',', '') }
}
