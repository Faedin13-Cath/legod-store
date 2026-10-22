import { describe, it, expect, vi, beforeEach } from 'vitest'

// Prueba del endpoint de entregas con un Supabase de mentira: lo que importa es
// qué se escribe (y qué NO) según el contacto guardado y las banderas del formulario.

type Row = Record<string, unknown> | null
const db = {
  contacto: null as Row,
  writes: [] as { t: string; op: string; v: unknown }[],
  uploads: 0,
  // Números de bolsa ya ocupados, para probar que se da el hueco más chico.
  numerosOcupados: [] as number[],
  // La lectura de números ocupados falla (p. ej. caché de esquema de PostgREST).
  numerosFallan: false,
  // Errores que devuelve, en orden, cada insert en `entregas` (null = éxito).
  erroresInsert: [] as ({ code: string; message: string } | null)[],
  lecturasNumero: 0,
}

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
      select: () => ({
        // Contacto por teléfono.
        eq: () => ({ maybeSingle: async () => ({ data: db.contacto, error: null }) }),
        // Números de bolsa ocupados (numeroLibre).
        not: () => ({ neq: () => ({ order: async () => {
          db.lecturasNumero++
          return db.numerosFallan
            ? { data: null, error: { message: 'schema cache' } }
            : { data: db.numerosOcupados.map(n => ({ numero: n })), error: null }
        } }) }),
      }),
      insert: (v: unknown) => {
        db.writes.push({ t, op: 'insert', v })
        const err = t === 'entregas' ? (db.erroresInsert.shift() ?? null) : null
        return {
          select: () => ({ single: async () => ({ data: { id: 'nuevo' }, error: null }) }),
          then: (r: (x: unknown) => void) => r({ error: err }),
        }
      },
      update: (v: unknown) => { db.writes.push({ t, op: 'update', v }); return { eq: async () => ({ error: null }) } },
    }),
  }),
}))
vi.mock('@/lib/entregas-perfiles', () => ({ perfilesPorTelefono: async () => [] }))
// El código se prueba aparte (entregas-codigo.test.ts); aquí solo importa si el endpoint lo exige.
const codigoResp = { valor: 'invalido' as 'ok' | 'invalido' | 'error', llamadas: [] as string[] }
vi.mock('@/lib/entregas-codigo', () => ({
  verificarYGastarCodigo: async (_s: unknown, _id: string, codigo: string) => {
    codigoResp.llamadas.push(codigo)
    return codigoResp.valor
  },
}))

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

beforeEach(() => {
  db.contacto = null; db.writes = []; db.uploads = 0; db.numerosOcupados = []
  db.numerosFallan = false; db.erroresInsert = []; db.lecturasNumero = 0
  codigoResp.valor = 'invalido'; codigoResp.llamadas = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

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
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true', nombre: 'Ana', email: 'ana@example.com' }, true)
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
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true', noSoyYo: 'true', nombre: 'Otro', email: 'otro@example.com' })
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
    codigoResp.valor = 'ok'
    const r = await req({
      tipo: 'envio', paqueteria: 'FedEx', recibe: 'A', calle: 'Nueva', numExt: '1',
      colonia: 'C', ciudad: 'D', estado: 'E', cp: '01000', referencia: 'R', codigo: '123456',
    })
    expect(r.status).toBe(200)
    const cambios = db.writes.find(w => w.op === 'update')?.v as Record<string, unknown>
    expect(cambios.calle).toBe('Nueva')
    expect('nombre' in cambios).toBe(false)
  })

  it('cliente nuevo sin nombre: 400 falta_nombre; con nombre y correo se guarda', async () => {
    const r = await req({ tipo: 'rock_show' })
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('falta_nombre')
    expect((await req({ tipo: 'rock_show', nombre: 'Ana', email: 'ana@example.com' })).status).toBe(200)
  })

  it('cliente nuevo sin correo: se guarda igual, porque hay quien no tiene', async () => {
    const r = await req({ tipo: 'rock_show', nombre: 'Ana' })
    expect(r.status).toBe(200)
    const contacto = db.writes.find(w => w.t === 'entrega_contactos')?.v as { email?: string } | undefined
    expect(contacto?.email).toBeFalsy()
  })

  it('"no soy yo" exige nombre y deja la entrega en conflicto', async () => {
    db.contacto = GUARDADA
    expect((await req({ tipo: 'rock_show', noSoyYo: 'true' })).status).toBe(400)
    expect((await req({ tipo: 'rock_show', noSoyYo: 'true', nombre: 'Otro', email: 'otro@example.com' })).status).toBe(200)
    expect(entrega()?.status).toBe('conflicto')
    expect(escriturasContacto()).toEqual([])
  })
})

describe('POST /api/entregas: número de bolsa', () => {
  const numeroGuardado = () =>
    (db.writes.find(w => w.t === 'entregas')?.v as { numero?: number } | undefined)?.numero

  it('Rock Show recibe el hueco más chico y se lo devuelve al cliente', async () => {
    db.numerosOcupados = [1, 2, 4]
    const r = await req({ tipo: 'rock_show', nombre: 'Ana', email: 'ana@example.com' })
    expect(r.status).toBe(200)
    expect((await r.json()).numero).toBe(3)
    expect(numeroGuardado()).toBe(3)
  })

  it('los envíos no llevan número', async () => {
    db.contacto = GUARDADA
    const r = await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true' })
    expect(r.status).toBe(200)
    expect((await r.json()).numero).toBeUndefined()
    expect(numeroGuardado()).toBeUndefined()
  })
})

describe('POST /api/entregas: carreras y respaldo del número', () => {
  const inserciones = () => db.writes.filter(w => w.t === 'entregas').map(w => w.v as { numero?: number })
  const nuevo = { tipo: 'rock_show', nombre: 'Ana', email: 'ana@example.com' }
  const choque = { code: '23505', message: 'duplicate key' }

  it('ante 23505 vuelve a leer y reintenta; entrega el número del segundo intento', async () => {
    db.numerosOcupados = [1, 2]
    db.erroresInsert = [choque]
    const r = await req(nuevo)
    expect(r.status).toBe(200)
    expect(inserciones()).toHaveLength(2)
    expect(db.lecturasNumero).toBe(2)
    expect((await r.json()).numero).toBe(3)
  })

  it('un error que no es 23505 falla con 500 sin reintentar', async () => {
    db.erroresInsert = [{ code: '42P01', message: 'boom' }]
    const r = await req(nuevo)
    expect(r.status).toBe(500)
    expect(inserciones()).toHaveLength(1)
  })

  it('5 choques seguidos: guarda sin número y lo avisa con sinNumero', async () => {
    db.erroresInsert = [choque, choque, choque, choque, choque]
    const r = await req(nuevo)
    const cuerpo = await r.json()
    expect(r.status).toBe(200)
    expect(cuerpo.sinNumero).toBe(true)
    expect(cuerpo.numero).toBeUndefined()
    const filas = inserciones()
    expect(filas).toHaveLength(6)
    expect(filas[5].numero).toBeUndefined()
  })

  it('si no se pueden leer los números: no gasta reintentos, guarda sin número y avisa', async () => {
    db.numerosFallan = true
    const r = await req(nuevo)
    const cuerpo = await r.json()
    expect(r.status).toBe(200)
    expect(cuerpo.sinNumero).toBe(true)
    expect(db.lecturasNumero).toBe(1)
    const filas = inserciones()
    expect(filas).toHaveLength(1)
    expect(filas[0].numero).toBeUndefined()
  })

  it('con número normal no marca sinNumero', async () => {
    const r = await req(nuevo)
    expect((await r.json()).sinNumero).toBeUndefined()
  })
})

describe('POST /api/entregas: código para cambiar datos guardados', () => {
  const dirNueva = {
    tipo: 'envio', paqueteria: 'FedEx', recibe: 'A', calle: 'Nueva', numExt: '1',
    colonia: 'C', ciudad: 'D', estado: 'E', cp: '01000', referencia: 'R',
  }
  const CON_CORREO = { ...GUARDADA, email: 'ana@example.com' }
  const actualizaciones = () => db.writes.filter(w => w.op === 'update')

  it('dirección nueva sin código: 400 codigo_requerido y no se escribe ni se sube nada', async () => {
    db.contacto = CON_CORREO
    const r = await req(dirNueva, true)
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('codigo_requerido')
    expect(db.writes).toEqual([])
    expect(db.uploads).toBe(0)
  })

  it('dirección nueva con código malo, vencido o usado: 400 codigo_invalido y no se escribe nada', async () => {
    db.contacto = CON_CORREO
    codigoResp.valor = 'invalido'
    const r = await req({ ...dirNueva, codigo: '123456' })
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('codigo_invalido')
    expect(codigoResp.llamadas).toEqual(['123456'])
    expect(db.writes).toEqual([])
  })

  it('dirección nueva con código bueno: se guarda', async () => {
    db.contacto = CON_CORREO
    codigoResp.valor = 'ok'
    const r = await req({ ...dirNueva, codigo: '123456' })
    expect(r.status).toBe(200)
    expect((actualizaciones()[0].v as Record<string, unknown>).calle).toBe('Nueva')
  })

  it('un correo nuevo sin código no reemplaza el guardado (así no se podría autoverificar)', async () => {
    db.contacto = CON_CORREO
    const r = await req({ tipo: 'rock_show', email: 'atacante@example.com' })
    expect(r.status).toBe(400)
    expect((await r.json()).codigo).toBe('codigo_requerido')
    expect(db.writes).toEqual([])
  })

  it('un correo nuevo con código malo: no se escribe nada', async () => {
    db.contacto = CON_CORREO
    const r = await req({ tipo: 'rock_show', email: 'atacante@example.com', codigo: '999999' })
    expect(r.status).toBe(400)
    expect(db.writes).toEqual([])
  })

  it('un correo nuevo con código bueno sí se guarda', async () => {
    db.contacto = CON_CORREO
    codigoResp.valor = 'ok'
    const r = await req({ tipo: 'rock_show', email: 'nuevo@example.com', codigo: '123456' })
    expect(r.status).toBe(200)
    expect((actualizaciones()[0].v as Record<string, unknown>).email).toBe('nuevo@example.com')
  })

  it('contacto sin correo guardado que manda uno: también pide código (no se registra uno ajeno)', async () => {
    db.contacto = GUARDADA
    const r = await req({ tipo: 'rock_show', email: 'atacante@example.com' })
    expect(r.status).toBe(400)
    expect(db.writes).toEqual([])
  })

  it('si la base falla al revisar el código: 500, no se escribe', async () => {
    db.contacto = CON_CORREO
    codigoResp.valor = 'error'
    const r = await req({ ...dirNueva, codigo: '123456' })
    expect(r.status).toBe(500)
    expect(db.writes).toEqual([])
  })

  it('no pide código: mismo correo, "Continuar", "no soy yo" ni cliente nuevo', async () => {
    db.contacto = CON_CORREO
    expect((await req({ tipo: 'rock_show', email: 'ANA@example.com' })).status).toBe(200)
    expect((await req({ tipo: 'envio', paqueteria: 'Estafeta', usarGuardada: 'true' })).status).toBe(200)
    expect((await req({ tipo: 'rock_show', noSoyYo: 'true', nombre: 'Otro', email: 'otro@example.com' })).status).toBe(200)
    expect(codigoResp.llamadas).toEqual([])
    db.contacto = null
    expect((await req({ tipo: 'rock_show', nombre: 'Ana', email: 'nueva@example.com' })).status).toBe(200)
    expect(codigoResp.llamadas).toEqual([])
  })
})
