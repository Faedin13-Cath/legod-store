'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '5215512345678'

type ApartadoItem = { id: string; name: string; price: number; qty: number; tag?: string }
type Apartado = {
  id: string
  items: ApartadoItem[]
  subtotal: number
  deposit: number
  balance: number
  deadline_at: string
  status: string
  created_at: string
}

function useCountdown(deadline: string) {
  const [ms, setMs] = useState(() => new Date(deadline).getTime() - Date.now())
  useEffect(() => {
    const iv = setInterval(() => setMs(new Date(deadline).getTime() - Date.now()), 60_000)
    return () => clearInterval(iv)
  }, [deadline])
  return ms
}

function CountdownBadge({ deadline }: { deadline: string }) {
  const ms   = useCountdown(deadline)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hrs  = Math.floor(ms / (1000 * 60 * 60))

  if (ms <= 0) return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: '#FCE3E3', color: '#A23030', border: '1px solid #F2BFBF' }}>
      Vencido
    </span>
  )
  const urgent = days < 3
  const label  = days > 0 ? `${days}d restantes` : `${hrs}h restantes`
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: urgent ? '#FCE3E3' : 'var(--accent-soft)', color: urgent ? '#A23030' : 'var(--accent)', border: `1px solid ${urgent ? '#F2BFBF' : 'var(--accent)'}` }}>
      {label}
    </span>
  )
}

function ApartadoCard({ ap, onPaid }: { ap: Apartado; onPaid: (id: string) => void }) {
  const supabase = createClient()
  const pct = Math.round((ap.deposit / ap.subtotal) * 100)
  const expired  = new Date(ap.deadline_at).getTime() < Date.now()

  const itemNames = ap.items.map(i => `${i.name}${i.qty > 1 ? ` x${i.qty}` : ''}`).join(', ')

  function pagarAnticipo() {
    const fecha = new Date(ap.deadline_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    const msg = [
      `¡Hola! Me gustaría pagar el anticipo de mi apartado:`,
      ``,
      `📦 ${itemNames}`,
      ``,
      `💰 Total: $${ap.subtotal.toLocaleString('es-MX')} MXN`,
      `🏷️ Anticipo (40%): $${ap.deposit.toLocaleString('es-MX')} MXN`,
      `📅 Fecha límite: ${fecha}`,
      ``,
      `¿Me puedes enviar los datos de pago?`,
    ].join('\n')
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function pagarSaldo() {
    const msg = [
      `¡Hola! Quiero liquidar el saldo de mi apartado:`,
      ``,
      `📦 ${itemNames}`,
      ``,
      `🏷️ Saldo pendiente: $${ap.balance.toLocaleString('es-MX')} MXN`,
      ``,
      `¿Cómo procedo?`,
    ].join('\n')
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  async function cancelar() {
    if (!confirm('¿Cancelar este apartado? El anticipo no es reembolsable.')) return
    await supabase.from('apartados').update({ status: 'cancelled' }).eq('id', ap.id)
    onPaid(ap.id)
  }

  return (
    <div style={{
      background: 'var(--paper)', border: `1px solid ${expired ? '#F2BFBF' : 'var(--line)'}`,
      borderRadius: 16, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 10, flexShrink: 0,
          background: 'var(--accent-soft)', border: '1px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
        }}>
          <Icon name="clock" size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
                {ap.items.length === 1
                  ? ap.items[0].name
                  : `${ap.items[0].name} + ${ap.items.length - 1} más`}
              </div>
              {ap.items.length > 1 && (
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                  {ap.items.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(' · ')}
                </div>
              )}
            </div>
            <CountdownBadge deadline={ap.deadline_at} />
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 5 }}>
              <span>Anticipo pagado: <strong>${ap.deposit.toLocaleString('es-MX')} MXN</strong></span>
              <span>Saldo: <strong>${ap.balance.toLocaleString('es-MX')} MXN</strong></span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {pct}% cubierto · Total: ${ap.subtotal.toLocaleString('es-MX')} MXN
            </div>
          </div>

          {/* Actions */}
          {!expired ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={pagarAnticipo} className="btn btn-primary btn-sm">
                Pagar anticipo ${ap.deposit.toLocaleString('es-MX')} MXN →
              </button>
              <button onClick={pagarSaldo} className="btn btn-secondary btn-sm">
                Ya pagué — liquidar saldo
              </button>
              <button onClick={cancelar} className="btn btn-secondary btn-sm" style={{ color: 'var(--ink-3)' }}>
                Cancelar
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#A23030', fontWeight: 500 }}>
              Este apartado venció. Contáctanos si necesitas una extensión.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ApartadosPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [apartados, setApartados] = useState<Apartado[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('apartados')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setApartados((data ?? []) as Apartado[])
        setLoading(false)
      })
  }, [user])

  function remove(id: string) {
    setApartados(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Apartados</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Tus figuras están reservadas. Toca <strong>&ldquo;Pagar anticipo&rdquo;</strong> para enviarnos los datos y confirmar tu apartado.
      </p>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
          Cargando apartados…
        </div>
      ) : apartados.length === 0 ? (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '56px', textAlign: 'center' }}>
          <div style={{ color: 'var(--ink-4)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <Icon name="clock" size={32} />
          </div>
          <p style={{ color: 'var(--ink-3)', margin: '0 0 16px', fontSize: 14 }}>No tienes apartados activos.</p>
          <Link href="/tienda" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Ver tienda
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {apartados.map(ap => (
            <ApartadoCard key={ap.id} ap={ap} onPaid={remove} />
          ))}
        </div>
      )}

      {/* Info box */}
      <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 12, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
        <strong>¿Cómo funciona el apartado?</strong><br />
        Reservas con 40% de anticipo. El plazo para liquidar depende del total: hasta $1,000 tienes 1 semana; de $1,001 a $4,000 tienes 15 días; más de $4,000 tienes 1 mes. Si no liquidas a tiempo, el anticipo no es reembolsable.{' '}
        <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 500 }}>
          Escríbenos si necesitas una extensión.
        </a>
      </div>
    </div>
  )
}
