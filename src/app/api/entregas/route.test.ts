import { describe, it, expect, vi, beforeEach } from 'vitest'

// Prueba del endpoint de entregas con un Supabase de mentira: lo que importa es
// qué se escribe (y qué NO) según el contacto guardado y las banderas del formulario.

type Row = Record<string, unknown> | null
const db = { contacto: null as Row, writes: [] as { t: string; op: string; v: unknown }[], uploads: 0 }

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    storage: {
      createBucket: async () => ({}),
      from: () => ({
        upload: async () => { db.uploads++; return { error: null } },
        getPublicUrl: () => ({ data: { publicUrl: 'u' } }),
      }),
    },
    from: (t: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.contacto, error: null }) }) }),
      insert: (v: unknown) => {
        db.writes.push({ t, op: 'insert', v })
        return {
          select: () => ({ single: async () => ({ data: { id: 'nuevo' }, error: null }) }),
          then: (r: (x: unknown) => void) => r({ error: null }),
        }
      },
      update: (v: unknown) => { db.writes.push({ t, op: 'update', v }); return { eq: async () => ({ error: null }) } },
    }),
  }),
}))
vi.mock('@/lib/entregas-perfiles', () => ({ perfilesPorTelefono: async () => [] }))

import { POST } from './route'

// El nombre completo guardado: buscar solo devuelve el de pila, así que nunca debe pisarse.
const GUARDADA = {
  id: 'c1', nombre: 'Santiago Rodríguez Flores',
  calle: 'Reforma', num_ext: '12', num_int: null, colonia: 'Juárez',
  ciudad: 'CDMX', estado: 'CDMX', cp: '06600', referencia: 'Casa azul',
}
const DIRECCION_GUARDADA = {
  calle: 'Reforma', numExt: '12', numInt: null, colonia: 'Juárez',
  ciudad: 'CDMX', estado: 'CDMX', cp: '06600', referencia: 'Casa azul',
}

function req(campos: Record<string, string>, foto = false) {
  const fd = new FormData()
  for (const [k, v] of Object.entries({ telefono: '5512345678', piezas: 'Vader', resta: '0', ...campos })) fd.set(k, v)
  if (foto) fd.set('foto', new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
  return POST(new Request('http://x/api/entregas', { method: 'POST', body: fd }) as never)
}
const entrega = () => db.writes.find(w => w.t === 'entregas')?.v as Record<string, unknown> | undefined
const escriturasContacto = () => db.writes.filter(w => w.t === 'entrega_contactos')

beforeEach(() => { db.contacto = null; db.writes = []; db.uploads = 0 })

describe('POST /api/entregas: usarGuardada', () => {
  it('arma el snapshot con la dirección guardada y no toca la dirección del contacto', async () => {
    db.contacto = GUARDADA
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true' })
    expect(r.status).toBe(200)
    expect(entrega()?.direccion).toEqual(DIRECCION_GUARDADA)
    expect(entrega()?.paqueteria).toBe('Estafeta')
    expect(escriturasContacto()).toEqual([])
  })

  it('sin contacto: 400 sin_direccion_guardada y no se escribe nada ni se sube la foto', async () => {
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true', nombre: 'Ana' }, true)
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('sin_direccion_guardada')
    expect(db.writes).toEqual([])
    expect(db.uploads).toBe(0)
  })

  it('dirección guardada incompleta: 400 y no se escribe nada', async () => {
    db.contacto = { ...GUARDADA, referencia: null }
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true' }, true)
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('sin_direccion_guardada')
    expect(db.writes).toEqual([])
    expect(db.uploads).toBe(0)
  })

  it('con "no soy yo" no usa la dirección de otra persona', async () => {
    db.contacto = GUARDADA
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true', noSoyYo: 'true', nombre: 'Otro' })
    expect(r.status).toBe(400)
    expect(db.writes).toEqual([])
  })

  it('se ignora en Rock Show (sin dirección)', async () => {
    db.contacto = GUARDADA
    const r = await req({ tipo: 'rock_show', usarGuardada: 'true' })
    expect(r.status).toBe(200)
    expect(entrega()?.direccion).toBeNull()
  })

  it('exige una paquetería válida', async () => {
    db.contacto = GUARDADA
    expect((await req({ tipo: 'envio', usarGuardada: 'true' })).status).toBe(400)
    expect((await req({ tipo: 'envio', usarGuardada: 'true', paqueteria: 'DHL' })).status).toBe(400)
  })
})

describe('POST /api/entregas: nombre', () => {
  it('cliente reconocido sin nombre: guarda la entrega y no reescribe el contacto', async () => {
    db.contacto = GUARDADA
    const r = await req({ tipo: 'rock_show' })
    expect(r.status).toBe(200)
    expect(escriturasContacto()).toEqual([])
  })

  it('cliente reconocido con dirección nueva: actualiza la dirección pero nunca el nombre', async () => {
    db.contacto = GUARDADA
    const r = await req({
      tipo: 'envio', paqueteria: 'FedEx', recibe: 'A', calle: 'Nueva', numExt: '1',
      colonia: 'C', ciudad: 'D', estado: 'E', cp: '01000', referencia: 'R',
    })
    expect(r.status).toBe(200)
    const cambios = db.writes.find(w => w.op === 'update')?.v as Record<string, unknown>
    expect(cambios.calle).toBe('Nueva')
    expect('nombre' in cambios).toBe(false)
  })

  it('cliente nuevo sin nombre: 400 falta_nombre; con nombre se guarda', async () => {
    const r = await req({ tipo: 'rock_show' })
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('falta_nombre')
    expect((await req({ tipo: 'rock_show', nombre: 'Ana' })).status).toBe(200)
  })

  it('"no soy yo" exige nombre y deja la entrega en conflicto', async () => {
    db.contacto = GUARDADA
    expect((await req({ tipo: 'rock_show', noSoyYo: 'true' })).status).toBe(400)
    expect((await req({ tipo: 'rock_show', noSoyYo: 'true', nombre: 'Otro' })).status).toBe(200)
    expect(entrega()?.status).toBe('conflicto')
    expect(escriturasContacto()).toEqual([])
  })
})
