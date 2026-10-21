import { describe, it, expect, beforeEach, vi } from 'vitest'
import { verificarYGastarCodigo, hashCodigo } from './entregas-codigo'

// Supabase de mentira, en memoria, solo con lo que usa verificarYGastarCodigo.
type Fila = { id: string; contacto_id: string; codigo_hash: string; expira_at: string; intentos: number; usado: boolean; created_at: string }
let filas: Fila[] = []

function consulta() {
  const filtros: ((f: Fila) => boolean)[] = []
  let cambios: Partial<Fila> | null = null
  let limite = Infinity
  let desc = false
  const elegidas = () => {
    let r = filas.filter(f => filtros.every(fn => fn(f)))
    if (desc) r = [...r].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return r.slice(0, limite)
  }
  const q: Record<string, unknown> = {
    select: () => q,
    update: (c: Partial<Fila>) => { cambios = c; return q },
    eq: (k: keyof Fila, v: unknown) => { filtros.push(f => f[k] === v); return q },
    gt: (k: keyof Fila, v: string) => { filtros.push(f => String(f[k]) > v); return q },
    order: () => { desc = true; return q },
    limit: (n: number) => { limite = n; return q },
    maybeSingle: async () => ({ data: elegidas()[0] ?? null, error: null }),
    then: (r: (x: unknown) => void) => {
      const rs = elegidas()
      if (cambios) rs.forEach(f => Object.assign(f, cambios))
      r({ data: rs.map(f => ({ id: f.id })), error: null })
    },
  }
  return q
}
const supabase = { from: () => consulta() } as never

const nuevo = (codigo: string, extra: Partial<Fila> = {}): Fila => ({
  id: 'k1', contacto_id: 'c1', codigo_hash: hashCodigo(codigo),
  expira_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  intentos: 0, usado: false, created_at: new Date().toISOString(), ...extra,
})

beforeEach(() => { filas = []; vi.spyOn(console, 'error').mockImplementation(() => {}) })

describe('verificarYGastarCodigo', () => {
  it('acepta el código bueno y lo gasta: no sirve dos veces', async () => {
    filas = [nuevo('123456')]
    expect(await verificarYGastarCodigo(supabase, 'c1', '123456')).toBe('ok')
    expect(filas[0].usado).toBe(true)
    expect(await verificarYGastarCodigo(supabase, 'c1', '123456')).toBe('invalido')
  })
  it('rechaza uno equivocado y cuenta el intento', async () => {
    filas = [nuevo('123456')]
    expect(await verificarYGastarCodigo(supabase, 'c1', '000000')).toBe('invalido')
    expect(filas[0].intentos).toBe(1)
    expect(filas[0].usado).toBe(false)
  })
  it('rechaza uno vencido', async () => {
    filas = [nuevo('123456', { expira_at: new Date(Date.now() - 1000).toISOString() })]
    expect(await verificarYGastarCodigo(supabase, 'c1', '123456')).toBe('invalido')
  })
  it('con 5 intentos ya gastados ni el código bueno sirve', async () => {
    filas = [nuevo('123456', { intentos: 5 })]
    expect(await verificarYGastarCodigo(supabase, 'c1', '123456')).toBe('invalido')
    expect(filas[0].usado).toBe(false)
  })
  it('el quinto intento fallido cierra el código', async () => {
    filas = [nuevo('123456')]
    for (let i = 0; i < 5; i++) await verificarYGastarCodigo(supabase, 'c1', '000000')
    expect(await verificarYGastarCodigo(supabase, 'c1', '123456')).toBe('invalido')
  })
  it('un código de otro contacto no vale', async () => {
    filas = [nuevo('123456', { contacto_id: 'otro' })]
    expect(await verificarYGastarCodigo(supabase, 'c1', '123456')).toBe('invalido')
  })
  it('lo que no son 6 dígitos ni toca la base', async () => {
    filas = [nuevo('123456')]
    expect(await verificarYGastarCodigo(supabase, 'c1', '12345')).toBe('invalido')
    expect(await verificarYGastarCodigo(supabase, 'c1', '')).toBe('invalido')
    expect(filas[0].intentos).toBe(0)
  })
})
