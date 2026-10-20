import { describe, it, expect } from 'vitest'
import {
  normalizarTelefono,
  enmascararCalle,
  enmascararColonia,
  enmascararCP,
  enmascararEmail,
} from './entregas'

describe('normalizarTelefono', () => {
  it('acepta las formas en que la gente escribe su celular', () => {
    expect(normalizarTelefono('5512345678')).toBe('5512345678')
    expect(normalizarTelefono('55 1234 5678')).toBe('5512345678')
    expect(normalizarTelefono('55-1234-5678')).toBe('5512345678')
    expect(normalizarTelefono('+52 55 1234 5678')).toBe('5512345678')
    expect(normalizarTelefono('5215512345678')).toBe('5512345678')   // 52 + 1 viejo
    expect(normalizarTelefono('044 5512345678')).toBe('5512345678')  // lada vieja
    expect(normalizarTelefono('(55) 1234 5678')).toBe('5512345678')
  })
  it('rechaza lo que no es un celular', () => {
    expect(normalizarTelefono('123')).toBeNull()
    expect(normalizarTelefono('')).toBeNull()
    expect(normalizarTelefono('no tengo')).toBeNull()
  })
})

describe('enmascarar', () => {
  it('deja reconocer sin dejar copiar', () => {
    expect(enmascararCalle('Morelos', '142')).toBe('Morelos 1••')
    expect(enmascararColonia('Centro')).toBe('C•••••')
    expect(enmascararCP('06010')).toBe('06••0')
    expect(enmascararEmail('santiago.r@gmail.com')).toBe('san•••@gmail.com')
  })
  it('no truena con datos faltantes', () => {
    expect(enmascararCalle('', '')).toBe('')
    expect(enmascararEmail('')).toBe('')
  })
})
