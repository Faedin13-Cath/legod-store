'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { LLEGADA_TENTATIVA } from '@/lib/preventa'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'

type PreventaItem = {
  id: string; name: string; qty: number
  total?: number; pagado?: number; pendiente?: number
}
type Preventa = {
  id: string
  items: PreventaItem[]
  modalidad: 'completo' | 'split' | 'mixta'
  total: number
  pagado: number
  pendiente: number
  status: string
  created_at: string
}

function PreventaCard({ pv, llegadas }: { pv: Preventa; llegadas: Set<string> }) {
  const { user } = useAuth()
  const [paying, setPaying] = useState(false)
  const [error,  setError]  = useState('')

  const title = pv.items.length === 1
    ? pv.items[0].name
    : `${pv.items[0]?.name ?? 'Preventa'} + ${pv.items.length - 1} más`

  const liquidada = pv.pendiente <= 0
  const pct = pv.total > 0 ? Math.round((pv.pagado / pv.total) * 100) : 100

  // Solo se cobra lo que ya está en la tienda; el resto sigue esperando
  // aunque venga en el mismo apartado.
  const cobrables  = pv.items.filter(i => (i.pendiente ?? 0) > 0 && llegadas.has(i.id))
  const porCobrar  = cobrables.reduce((s, i) => s + (i.pendiente ?? 0), 0)
  const puedePagar = pv.status === 'active' && porCobrar > 0
  const esperando  = pv.items.filter(i => (i.pendiente ?? 0) > 0 && !llegadas.has(i.id))

  async function pagarSaldo() {
    setError(''); setPaying(true)
    try {
      const res = await fetch('/api/checkout/preventa/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preventaId: pv.id, userId: user?.id, userEmail: user?.email }),
      })
      const data = await res.json()
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return }
      setError(data.error ?? 'No se pudo generar el pago.')
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: 16, padding: '20px 24px',
      display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 10, flexShrink: 0,
        background: liquidada ? '#F0FBF4' : 'var(--accent-soft)',
        border: `1px solid ${liquidada ? '#86EFAC' : 'var(--accent)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: liquidada ? '#16A34A' : 'var(--accent)',
      }}>
        <Icon name={liquidada ? 'check' : 'clock'} size={22} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
            {title}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, flexShrink: 0,
            background: liquidada ? '#DCFCE7' : puedePagar ? '#FFF8E1' : 'var(--accent-soft)',
            color: liquidada ? '#166534' : puedePagar ? '#7A5B00' : 'var(--accent)',
            border: `1px solid ${liquidada ? '#86EFAC' : puedePagar ? '#F5C84A' : 'var(--accent)'}`,
          }}>
            {liquidada ? 'Pagada' : puedePagar ? '¡Ya llegó!' : 'Saldo pendiente'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 5 }}>
          <span>Pagado: <strong>${pv.pagado.toLocaleString('es-MX')} MXN</strong></span>
          {!liquidada && <span>Falta: <strong>${pv.pendiente.toLocaleString('es-MX')} MXN</strong></span>}
        </div>
        <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: liquidada ? '#22C55E' : 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
          {pct}% cubierto · Total: ${pv.total.toLocaleString('es-MX')} MXN
        </div>

        {/* Estado figura por figura */}
        {pv.items.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pv.items.map((it, idx) => {
              const pend    = it.pendiente ?? 0
              const llego   = llegadas.has(it.id)
              const pagadaI = pend <= 0
              return (
                <div key={`${it.id}-${idx}`} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: 'var(--ink-2)',
                }}>
                  <span style={{
                    color: pagadaI ? '#16A34A' : llego ? '#B8860B' : 'var(--ink-4)',
                    display: 'flex', flexShrink: 0,
                  }}>
                    <Icon name={pagadaI ? 'check' : llego ? 'package' : 'clock'} size={13} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    {it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: 11, color: pagadaI ? '#16A34A' : llego ? '#B8860B' : 'var(--ink-3)', fontWeight: 500 }}>
                    {pagadaI ? 'Pagada' : llego ? `Ya llegó · faltan $${pend.toLocaleString('es-MX')}` : 'En camino'}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {puedePagar ? (
          <div style={{
            marginTop: 12, padding: '14px 16px', borderRadius: 10,
            background: '#FFF8E1', border: '1px solid #F5C84A',
          }}>
            <div style={{ fontSize: 13, color: '#7A5B00', lineHeight: 1.6, marginBottom: 10 }}>
              {cobrables.length === pv.items.length
                ? 'Tus figuras ya están en la tienda.'
                : `Ya ${cobrables.length === 1 ? 'llegó' : 'llegaron'} ${cobrables.length} de ${pv.items.length}.`}{' '}
              Paga <strong>${porCobrar.toLocaleString('es-MX')} MXN</strong> y coordinamos el envío
              {esperando.length > 0 && ' de lo que ya llegó'}.
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 8 }}>{error}</div>
            )}
            <button onClick={pagarSaldo} disabled={paying} className="btn btn-primary btn-sm">
              {paying ? 'Generando pago…' : `Pagar $${porCobrar.toLocaleString('es-MX')} MXN →`}
            </button>
          </div>
        ) : (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 10,
            background: 'var(--cream)', border: '1px solid var(--line)',
            fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--ink)' }}>Llegada tentativa: {LLEGADA_TENTATIVA}</strong>{' '}
            (puede tardar más).{' '}
            {liquidada
              ? 'Ya está cubierta por completo. Te escribimos en cuanto llegue para coordinar el envío.'
              : <>En cuanto lleguen se activa aquí el pago de lo que falta y te avisamos.{' '}
                  <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                    ¿Dudas? Escríbenos.
                  </a>
                </>}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MisPreventasPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [list,     setList]     = useState<Preventa[]>([])
  const [llegadas, setLlegadas] = useState<Set<string>>(new Set())
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      supabase.from('preventas').select('*').eq('user_id', user.id)
        .in('status', ['active', 'completed']).order('created_at', { ascending: false }),
      supabase.from('preventa_arrivals').select('handle'),
    ]).then(([{ data }, { data: arr }]) => {
      setList((data ?? []) as Preventa[])
      setLlegadas(new Set((arr ?? []).map(a => a.handle as string)))
      setLoading(false)
    })
  }, [user])

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Preventas</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Figuras que reservaste antes de que llegaran a la tienda.
      </p>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
          Cargando preventas…
        </div>
      ) : list.length === 0 ? (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '56px', textAlign: 'center' }}>
          <div style={{ color: 'var(--ink-4)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <Icon name="clock" size={32} />
          </div>
          <p style={{ color: 'var(--ink-3)', margin: '0 0 16px', fontSize: 14 }}>Todavía no tienes preventas.</p>
          <Link href="/preventas" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Ver preventas
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {list.map(pv => <PreventaCard key={pv.id} pv={pv} llegadas={llegadas} />)}
        </div>
      )}
    </div>
  )
}
