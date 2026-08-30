'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { LLEGADA_TENTATIVA } from '@/lib/preventa'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'

type PreventaItem = { id: string; name: string; price: number; qty: number }
type Preventa = {
  id: string
  items: PreventaItem[]
  modalidad: 'completo' | 'split'
  total: number
  pagado: number
  pendiente: number
  status: string
  created_at: string
}

function PreventaCard({ pv }: { pv: Preventa }) {
  const title = pv.items.length === 1
    ? pv.items[0].name
    : `${pv.items[0]?.name ?? 'Preventa'} + ${pv.items.length - 1} más`

  const liquidada = pv.pendiente <= 0
  const pct = pv.total > 0 ? Math.round((pv.pagado / pv.total) * 100) : 100

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
            background: liquidada ? '#DCFCE7' : 'var(--accent-soft)',
            color: liquidada ? '#166534' : 'var(--accent)',
            border: `1px solid ${liquidada ? '#86EFAC' : 'var(--accent)'}`,
          }}>
            {liquidada ? 'Pagada' : 'Saldo pendiente'}
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

        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'var(--cream)', border: '1px solid var(--line)',
          fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--ink)' }}>Llegada tentativa: {LLEGADA_TENTATIVA}</strong>{' '}
          (puede tardar más).{' '}
          {liquidada
            ? 'Ya está cubierta por completo. Te escribimos en cuanto llegue para coordinar el envío.'
            : <>Cuando llegue te contactamos para cobrar los ${pv.pendiente.toLocaleString('es-MX')} MXN restantes y coordinar el envío.{' '}
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  ¿Dudas? Escríbenos.
                </a>
              </>}
        </div>
      </div>
    </div>
  )
}

export default function MisPreventasPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [list,    setList]    = useState<Preventa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('preventas')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setList((data ?? []) as Preventa[])
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
          {list.map(pv => <PreventaCard key={pv.id} pv={pv} />)}
        </div>
      )}
    </div>
  )
}
