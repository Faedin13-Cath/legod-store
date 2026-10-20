import { describe, it, expect } from 'vitest'
import {
  normalizarTelefono,
  enmascararCalle,
  enmascararColonia,
  enmascararCP,
  enmascararEmail,
  ipDe,
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

describe('ipDe', () => {
  it('lee la IP de los encabezados que pone Vercel', () => {
    expect(ipDe(new Headers({ 'x-vercel-forwarded-for': '189.1.2.3' }))).toBe('189.1.2.3')
    expect(ipDe(new Headers({ 'x-real-ip': '189.1.2.3' }))).toBe('189.1.2.3')
  })
  it('prefiere x-vercel-forwarded-for, luego x-real-ip, y x-forwarded-for al final', () => {
    expect(ipDe(new Headers({
      'x-vercel-forwarded-for': '189.1.2.3', 'x-real-ip': '8.8.8.8', 'x-forwarded-for': '1.1.1.1',
    }))).toBe('189.1.2.3')
    expect(ipDe(new Headers({ 'x-real-ip': '189.1.2.3', 'x-forwarded-for': '1.1.1.1' }))).toBe('189.1.2.3')
    expect(ipDe(new Headers({ 'x-forwarded-for': '189.1.2.3, 10.0.0.1' }))).toBe('189.1.2.3')
  })
  it('ignora encabezados vacíos y cae al siguiente', () => {
    expect(ipDe(new Headers({ 'x-forwarded-for': '', 'x-real-ip': '189.1.2.3' }))).toBe('189.1.2.3')
    expect(ipDe(new Headers({ 'x-vercel-forwarded-for': ' ', 'x-forwarded-for': '189.1.2.3' }))).toBe('189.1.2.3')
    expect(ipDe(new Headers({ 'x-forwarded-for': '' }))).toBe('desconocida')
  })
  it('da algo estable cuando no hay encabezados', () => {
    expect(ipDe(new Headers())).toBe('desconocida')
  })
})
