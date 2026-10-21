import { describe, it, expect, vi, beforeEach } from 'vitest'

// PATCH /api/admin/entregas: cuándo se renumera una bolsa al regresarla a pendiente.

type Fila = { tipo: string; numero: number | null; status: string }
const db = {
  filas: {} as Record<string, Fila>,
  ocupados: [] as number[],
  ocupadosFallan: false,
  errorUpdate: null as { code?: string; message: string } | null,
  updates: [] as { id: string; v: Record<string, unknown> }[],
  consultas: 0,
}

vi.mock('next/headers', () => ({ cookies: () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'u' } } }) } }),
}))
vi.mock('@/lib/admin', () => ({ isAdmin: async () => true }))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        // Lectura de la fila por id.
        eq: (_c: string, id: string) => ({ maybeSingle: async () => ({ data: db.filas[id] ?? null, error: null }) }),
        // Números ocupados (numerosOcupados).
        not: () => ({ neq: () => ({ order: async () => {
          db.consultas++
          return db.ocupadosFallan
            ? { data: null, error: { message: 'schema cache' } }
            : { data: db.ocupados.map(n => ({ numero: n })), error: null }
        } }) }),
      }),
      update: (v: Record<string, unknown>) => ({
        eq: async (_c: string, id: string) => { db.updates.push({ id, v }); return { error: db.errorUpdate } },
      }),
    }),
  }),
}))

import { PATCH } from './route'

const patch = (id: string, status: string) =>
  PATCH(new Request('http://x/api/admin/entregas', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
  }) as never)

beforeEach(() => {
  db.filas = {}; db.ocupados = []; db.ocupadosFallan = false; db.errorUpdate = null
  db.updates = []; db.consultas = 0
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('PATCH /api/admin/entregas', () => {
  it('id inexistente: 404 y no actualiza nada', async () => {
    const r = await patch('nada', 'atendida')
    expect(r.status).toBe(404)
    expect((await r.json()).error).toMatch(/No existe/)
    expect(db.updates).toEqual([])
  })

  it('regresar una atendida conserva su número si sigue libre', async () => {
    db.filas.a = { tipo: 'rock_show', numero: 7, status: 'atendida' }
    db.ocupados = [1, 2, 3]
    const r = await patch('a', 'nueva')
    expect(await r.json()).toEqual({ ok: true, numero: 7, renumerado: false })
    expect(db.updates[0].v).toEqual({ status: 'nueva' })
  })

  it('si su número lo tomó otra bolsa, da el hueco más chico y avisa que cambió', async () => {
    db.filas.a = { tipo: 'rock_show', numero: 2, status: 'atendida' }
    db.ocupados = [1, 2, 4]
    const r = await patch('a', 'nueva')
    expect(await r.json()).toEqual({ ok: true, numero: 3, renumerado: true })
    expect(db.updates[0].v).toEqual({ status: 'nueva', numero: 3 })
  })

  it('una atendida sin número recibe uno y se avisa', async () => {
    db.filas.a = { tipo: 'rock_show', numero: null, status: 'atendida' }
    const r = await patch('a', 'nueva')
    expect(await r.json()).toEqual({ ok: true, numero: 1, renumerado: true })
  })

  it.each(['nueva', 'conflicto'])('una fila ya %s no se renumera', async (st) => {
    db.filas.a = { tipo: 'rock_show', numero: 5, status: st }
    db.ocupados = [5]
    const r = await patch('a', 'nueva')
    expect((await r.json()).renumerado).toBe(false)
    expect(db.updates[0].v).toEqual({ status: 'nueva' })
    expect(db.consultas).toBe(0)
  })

  it('un envío no recibe número', async () => {
    db.filas.a = { tipo: 'envio', numero: null, status: 'atendida' }
    const r = await patch('a', 'nueva')
    expect((await r.json()).numero).toBeNull()
    expect(db.updates[0].v).toEqual({ status: 'nueva' })
  })

  it('marcar atendida no toca el número', async () => {
    db.filas.a = { tipo: 'rock_show', numero: 4, status: 'nueva' }
    const r = await patch('a', 'atendida')
    expect(r.status).toBe(200)
    expect(db.updates[0].v).toEqual({ status: 'atendida' })
  })

  it('si no se pueden leer los números: 500 y no actualiza', async () => {
    db.filas.a = { tipo: 'rock_show', numero: 2, status: 'atendida' }
    db.ocupadosFallan = true
    const r = await patch('a', 'nueva')
    expect(r.status).toBe(500)
    expect(db.updates).toEqual([])
  })

  it('23505 al actualizar: 409 para reintentar', async () => {
    db.filas.a = { tipo: 'rock_show', numero: 2, status: 'atendida' }
    db.errorUpdate = { code: '23505', message: 'dup' }
    expect((await patch('a', 'nueva')).status).toBe(409)
  })
})
