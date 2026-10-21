import { describe, it, expect } from 'vitest'
import {
  normalizarTelefono,
  enmascararCalle,
  enmascararColonia,
  enmascararCP,
  enmascararEmail,
  ipDe,
  validarResta,
  validarPiezas,
  requiereCodigo,
} from './entregas'
import { primerHueco } from './entregas-numero'
import { generarCodigo, hashCodigo } from './entregas-codigo'

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

describe('validarResta', () => {
  it('acepta un número y el cero', () => {
    expect(validarResta('0')).toBe(0)
    expect(validarResta('350')).toBe(350)
    expect(validarResta('60.50')).toBe(60.5)
  })
  it('rechaza lo que no es un monto', () => {
    expect(validarResta('como $100')).toBeNull()
    expect(validarResta('-50')).toBeNull()
    expect(validarResta('')).toBeNull()
  })
})

describe('validarPiezas', () => {
  it('conserva completas las 25 figuras pegadas de WhatsApp', () => {
    const lista = Array.from({ length: 25 }, (_, i) => `Iron Man Mk ${i + 1}`).join('\n')
    expect(validarPiezas(lista)).toBe(lista)
  })
  it('normaliza CRLF del navegador a \n sin perder renglones', () => {
    expect(validarPiezas('Batman\r\nRobin\r\n\r\nJoker\r')).toBe('Batman\nRobin\n\nJoker')
  })
  it('rechaza vacío y lo absurdamente largo', () => {
    expect(validarPiezas('   ')).toBeNull()
    expect(validarPiezas('x'.repeat(5001))).toBeNull()
  })
})

describe('primerHueco (número de bolsa)', () => {
  it('empieza en 1 cuando no hay nada ocupado', () => {
    expect(primerHueco([])).toBe(1)
  })
  it('da el hueco más chico, no el siguiente del final', () => {
    expect(primerHueco([1, 2, 4])).toBe(3)
    expect(primerHueco([2, 3])).toBe(1)
    expect(primerHueco([1, 2, 3])).toBe(4)
  })
  it('un número repetido no corre la cuenta de más', () => {
    // El índice único lo impide en la base, pero si llegara se daría un hueco real.
    expect(primerHueco([1, 1, 2])).toBe(3)
  })
})

describe('generarCodigo', () => {
  it('da 6 dígitos', () => expect(generarCodigo()).toMatch(/^\d{6}$/))
  it('no repite el mismo código', () => {
    const vistos = new Set(Array.from({ length: 50 }, () => generarCodigo()))
    expect(vistos.size).toBeGreaterThan(40)
  })
  it('conserva los ceros a la izquierda', () => {
    const muchos = Array.from({ length: 3000 }, () => generarCodigo())
    expect(muchos.every(c => c.length === 6)).toBe(true)
    expect(muchos.some(c => c.startsWith('0'))).toBe(true)
  })
})

describe('hashCodigo', () => {
  it('es estable y no reversible a simple vista', () => {
    expect(hashCodigo('123456')).toBe(hashCodigo('123456'))
    expect(hashCodigo('123456')).not.toBe(hashCodigo('123457'))
    expect(hashCodigo('123456')).not.toContain('123456')
  })
})

describe('requiereCodigo', () => {
  const base = { existe: true, noSoyYo: false, direccionNueva: false, emailNuevo: null, emailGuardado: 'ana@example.com' }

  it('contacto nuevo: no pide código', () => {
    expect(requiereCodigo({ ...base, existe: false, direccionNueva: true, emailNuevo: 'otro@x.com' })).toBe(false)
  })
  it('"no soy yo": no pide código (no toca el contacto)', () => {
    expect(requiereCodigo({ ...base, noSoyYo: true, direccionNueva: true, emailNuevo: 'otro@x.com' })).toBe(false)
  })
  it('"Continuar" sin dirección ni correo nuevos: no pide código', () => {
    expect(requiereCodigo(base)).toBe(false)
  })
  it('dirección nueva de un contacto que existe: pide código', () => {
    expect(requiereCodigo({ ...base, direccionNueva: true })).toBe(true)
  })
  it('correo distinto al guardado: pide código', () => {
    expect(requiereCodigo({ ...base, emailNuevo: 'atacante@x.com' })).toBe(true)
  })
  it('contacto sin correo guardado que manda uno: pide código', () => {
    expect(requiereCodigo({ ...base, emailGuardado: null, emailNuevo: 'atacante@x.com' })).toBe(true)
  })
  it('el mismo correo (mayúsculas aparte) no pide código', () => {
    expect(requiereCodigo({ ...base, emailNuevo: 'ANA@Example.com' })).toBe(false)
  })
})
