import { describe, it, expect, vi, beforeEach } from 'vitest'

type Row = Record<string, unknown> | null
const db = { contacto: null as Row, perfil: null as Row, perfiles: [] as string[] }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (t: string) => {
      if (t === 'entrega_intentos') {
        return {
          insert: async () => ({ error: null }),
          delete: () => ({ lt: async () => ({}) }),
          select: () => ({ eq: () => ({ gte: async () => ({ count: 1, error: null }) }) }),
        }
      }
      const fila = () => (t === 'profiles' ? db.perfil : db.contacto)
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: fila(), error: null }) }) }) }
    },
  }),
}))
vi.mock('@/lib/entregas-perfiles', () => ({ perfilesPorTelefono: async () => db.perfiles }))

import { POST } from './route'

const buscar = () => POST(new Request('http://x/api/entregas/buscar', {
  method: 'POST', body: JSON.stringify({ telefono: '5512345678' }),
}) as never)

beforeEach(() => { db.contacto = null; db.perfil = null; db.perfiles = [] })

describe('POST /api/entregas/buscar', () => {
  it('contacto de entregas: enmascarado y con tieneNombre true', async () => {
    db.contacto = { nombre: 'Santiago Rodríguez Flores', email: 'santiago@mail.com', calle: 'Reforma', num_ext: '123', colonia: 'Juárez', cp: '06600' }
    const { contacto } = await (await buscar()).json()
    expect(contacto).toEqual({
      nombre: 'Santiago', calle: 'Reforma 1••', colonia: 'J•••••', cp: '06••0',
      email: 'san•••@mail.com', tieneDireccion: true, tieneNombre: true,
    })
  })

  it('solo perfil de la tienda: misma forma, tieneNombre false, sin nombre completo en la respuesta', async () => {
    db.perfiles = ['p1']
    db.perfil = { name: 'Ana Pérez', ship_name: null, email: 'ana@mail.com', ship_street: 'Hidalgo', ship_num_ext: '5', ship_colonia: 'Centro', ship_zip: '01000' }
    const body = await (await buscar()).json()
    expect(Object.keys(body.contacto).sort()).toEqual(['calle', 'colonia', 'cp', 'email', 'nombre', 'tieneDireccion', 'tieneNombre'])
    expect(body.contacto.tieneNombre).toBe(false)
    expect(JSON.stringify(body)).not.toContain('Pérez')
  })

  it('dos perfiles con el mismo celular: no reconoce a nadie', async () => {
    db.perfiles = ['p1', 'p2']
    expect((await (await buscar()).json()).contacto).toBeNull()
  })
})
