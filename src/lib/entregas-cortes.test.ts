import { describe, it, expect } from 'vitest'
import { estadoCorte } from './entregas-cortes'

// Ciudad de México es UTC-6 todo el año; los instantes se dan en UTC para que el
// test no dependa de la zona de quien lo corre.
// 2026-10-21 es miércoles, 2026-10-23 es viernes.
const utc = (s: string) => new Date(s)

describe('corte de envíos (miércoles 10:00 p. m.)', () => {
  it('antes del corte sigue dentro', () => {
    const e = estadoCorte('envio', utc('2026-10-22T03:59:00Z')) // mié 21:59
    expect(e.dentro).toBe(true)
    expect(e.fechaCierre).toBe('miércoles 21 de octubre')
  })
  it('a las 10:00 p. m. en punto ya cerró', () => {
    const e = estadoCorte('envio', utc('2026-10-22T04:00:00Z')) // mié 22:00
    expect(e.dentro).toBe(false)
    expect(e.fechaCierre).toBe('miércoles 28 de octubre')
  })
  it('lunes y martes están dentro; jueves a domingo ya son del siguiente', () => {
    expect(estadoCorte('envio', utc('2026-10-19T18:00:00Z')).dentro).toBe(true)  // lun
    expect(estadoCorte('envio', utc('2026-10-21T15:00:00Z')).dentro).toBe(true)  // mié 9:00
    expect(estadoCorte('envio', utc('2026-10-23T18:00:00Z')).dentro).toBe(false) // jue
    expect(estadoCorte('envio', utc('2026-10-26T05:59:00Z')).dentro).toBe(false) // dom 23:59
    expect(estadoCorte('envio', utc('2026-10-26T06:00:00Z')).dentro).toBe(true)  // lun 00:00
  })
  it('da día y hora para mostrar', () => {
    const e = estadoCorte('envio', utc('2026-10-20T18:00:00Z'))
    expect(e.diaCierre).toBe('miércoles')
    expect(e.horaCierre.replace(/\s/g, ' ')).toMatch(/^10:00 p\.\s?m\.$/)
  })
})

describe('corte del Rock Show (viernes 3:00 p. m.)', () => {
  it('antes del corte sigue dentro', () => {
    const e = estadoCorte('rock_show', utc('2026-10-23T20:59:00Z')) // vie 14:59
    expect(e.dentro).toBe(true)
    expect(e.fechaCierre).toBe('viernes 23 de octubre')
  })
  it('a las 3:00 p. m. en punto ya cerró', () => {
    const e = estadoCorte('rock_show', utc('2026-10-23T21:00:00Z')) // vie 15:00
    expect(e.dentro).toBe(false)
    expect(e.fechaCierre).toBe('viernes 30 de octubre')
  })
  it('un envío del miércoles por la noche aún entra al Rock Show', () => {
    expect(estadoCorte('rock_show', utc('2026-10-22T05:00:00Z')).dentro).toBe(true)
  })
})

describe('zona horaria', () => {
  it('el veredicto depende de la hora de México, no del instante local de quien mira', () => {
    // Mié 21:59 en México = jue 03:59 UTC = jue 12:59 en Tokio = mié 22:59 en Nueva York.
    // Quien lo calcule desde cualquier zona debe obtener lo mismo, porque la función
    // solo recibe el instante.
    const instante = utc('2026-10-22T03:59:00Z')
    const original = process.env.TZ
    const resultados = ['UTC', 'Asia/Tokyo', 'America/New_York', 'Pacific/Auckland'].map(tz => {
      process.env.TZ = tz
      return estadoCorte('envio', instante)
    })
    process.env.TZ = original
    for (const r of resultados) expect(r).toEqual(resultados[0])
    expect(resultados[0].dentro).toBe(true)
    // Un minuto después, ya cerró para todos.
    expect(estadoCorte('envio', utc('2026-10-22T04:00:00Z')).dentro).toBe(false)
  })
  it('en horario de verano de EE. UU. sigue usando la hora de México', () => {
    // Julio: Nueva York es UTC-4, México sigue en UTC-6. Mié 21:59 = jue 03:59 UTC.
    expect(estadoCorte('envio', utc('2026-07-02T03:59:00Z')).dentro).toBe(true)  // 2026-07-01 mié
    expect(estadoCorte('envio', utc('2026-07-02T04:00:00Z')).dentro).toBe(false)
  })
})
