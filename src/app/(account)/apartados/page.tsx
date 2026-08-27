'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import SaldoConfirmModal, { type ShippingData } from '@/components/cart/SaldoConfirmModal'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP ?? '525574777350'

type ApartadoItem = { id: string; name: string; price: number; qty: number }
type Apartado = {
  id: string; items: ApartadoItem[]; subtotal: number; deposit: number
  balance: number; deadline_at: string; status: string; created_at: string
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
      Caducado
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

function CompletedCard({ ap }: { ap: Apartado }) {
  const itemTitle = ap.items.length === 1 ? ap.items[0].name : `${ap.items[0].name} + ${ap.items.length - 1} más`
  return (
    <div style={{ background: '#F0FBF4', border: '1px solid #86EFAC', borderRadius: 16, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="check" size={20} color="#fff" />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>Pago exitoso — {itemTitle}</div>
        <div style={{ fontSize: 12, color: '#15803D', marginTop: 2 }}>
          Total pagado: ${ap.subtotal.toLocaleString('es-MX')} MXN · Tu figura está reservada para ti 🎉
        </div>
      </div>
    </div>
  )
}

function ApartadoCard({ ap, onRemove }: { ap: Apartado; onRemove: (id: string) => void }) {
  const supabase      = createClient()
  const { user, profile } = useAuth()
  const pct           = Math.round((ap.deposit / ap.subtotal) * 100)
  const expired       = new Date(ap.deadline_at).getTime() < Date.now()
  const [loadingSaldo, setLoadingSaldo] = useState(false)
  const [useBalance,   setUseBalance]   = useState(false)
  const [confirmOpen,  setConfirmOpen]  = useState(false)

  const userBalance  = profile?.balance ?? 0
  const saldoApplied = useBalance ? Math.min(userBalance, ap.balance) : 0
  const totalAPagar  = Math.max(0, ap.balance - saldoApplied)
  const fullSaldo    = saldoApplied > 0 && totalAPagar === 0

  // Con saldo → confirmar (y pedir dirección si cubre todo, porque esa orden
  // se crea directo en Shopify). Sin saldo → directo al checkout.
  function handlePagar() {
    if (saldoApplied > 0) { setConfirmOpen(true); return }
    pagarSaldo()
  }

  async function pagarSaldo(shipping?: ShippingData) {
    setLoadingSaldo(true)
    try {
      const res = await fetch('/api/checkout/liquidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartadoId:   ap.id,
          items:        ap.items.map(i => ({ name: i.name, qty: i.qty })),
          balance:      ap.balance,
          subtotal:     ap.subtotal,
          useBalance:   useBalance && saldoApplied > 0,
          balanceToUse: saldoApplied,
          userId:       user?.id,
          ...(user?.email ? { userEmail: user.email } : {}),
          ...(shipping ? { shipping } : {}),
        }),
      })
      const data = await res.json()
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        alert(data.error ?? 'Error al procesar el pago')
        setConfirmOpen(false)
      }
    } finally {
      setLoadingSaldo(false)
    }
  }

  async function cancelar() {
    if (!confirm('¿Cancelar este apartado? El anticipo no es reembolsable.')) return
    await supabase.from('apartados').update({ status: 'cancelled' }).eq('id', ap.id)
    onRemove(ap.id)
  }

  return (
    <>
    <div style={{
      background: 'var(--paper)',
      border: `1px solid ${expired ? '#F2BFBF' : 'var(--line)'}`,
      borderRadius: 16, padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 10, flexShrink: 0,
          background: expired ? '#FEF2F2' : 'var(--accent-soft)',
          border: `1px solid ${expired ? '#F2BFBF' : 'var(--accent)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: expired ? '#A23030' : 'var(--accent)',
        }}>
          <Icon name="clock" size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
                {ap.items.length === 1 ? ap.items[0].name : `${ap.items[0].name} + ${ap.items.length - 1} más`}
              </div>
              {ap.items.length > 1 && (
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                  {ap.items.map(i => `${i.name}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(' · ')}
                </div>
              )}
            </div>
            <CountdownBadge deadline={ap.deadline_at} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 5 }}>
              <span>Anticipo pagado: <strong>${ap.deposit.toLocaleString('es-MX')} MXN</strong></span>
              <span>Saldo: <strong>${ap.balance.toLocaleString('es-MX')} MXN</strong></span>
            </div>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: expired ? '#F87171' : 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>
              {pct}% cubierto · Total: ${ap.subtotal.toLocaleString('es-MX')} MXN
            </div>
          </div>

          {expired ? (
            <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #F2BFBF', borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: '#A23030', fontWeight: 600 }}>Apartado caducado</div>
              <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                El plazo para liquidar venció. El anticipo no es reembolsable.{' '}
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer" style={{ color: '#A23030', fontWeight: 600 }}>
                  Escríbenos si necesitas ayuda.
                </a>
              </div>
            </div>
          ) : (
            <>
              {userBalance > 0 && (
                <button onClick={() => setUseBalance(v => !v)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                  background: useBalance ? 'var(--accent-soft)' : 'var(--cream)',
                  border: `1px solid ${useBalance ? 'var(--accent)' : 'var(--line)'}`,
                  cursor: 'pointer', transition: 'all .12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      background: useBalance ? 'var(--accent)' : 'var(--paper)',
                      border: `2px solid ${useBalance ? 'var(--accent)' : 'var(--line)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {useBalance && <Icon name="check" size={8} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: useBalance ? 'var(--accent)' : 'var(--ink-2)' }}>
                      Usar mi saldo
                    </span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: useBalance ? 'var(--accent)' : 'var(--ink-3)' }}>
                    −${Math.min(userBalance, ap.balance).toLocaleString('es-MX')} MXN
                  </span>
                </button>
              )}
              {useBalance && saldoApplied > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-2)', marginBottom: 8, padding: '0 2px' }}>
                  <span>Total a pagar</span>
                  <strong style={{ color: 'var(--ink)' }}>${totalAPagar.toLocaleString('es-MX')} MXN</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={handlePagar} disabled={loadingSaldo} className="btn btn-primary btn-sm">
                  {loadingSaldo ? 'Generando pago…' : `Pagar $${(useBalance ? totalAPagar : ap.balance).toLocaleString('es-MX')} MXN →`}
                </button>
                <button onClick={cancelar} className="btn btn-secondary btn-sm" style={{ color: 'var(--ink-3)' }}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>

    <SaldoConfirmModal
      open={confirmOpen}
      title="Liquidar con saldo"
      amount={saldoApplied}
      total={ap.balance}
      needShipping={fullSaldo}
      loading={loadingSaldo}
      onCancel={() => !loadingSaldo && setConfirmOpen(false)}
      onConfirm={(shipping) => pagarSaldo(shipping)}
    />
    </>
  )
}

export default function ApartadosPage() {
  const { user }  = useAuth()
  const supabase  = createClient()
  const [active,    setActive]    = useState<Apartado[]>([])
  const [completed, setCompleted] = useState<Apartado[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('apartados')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const all = (data ?? []) as Apartado[]
        setActive(all.filter(a => a.status === 'active'))
        setCompleted(all.filter(a => a.status === 'completed'))
        setLoading(false)
      })
  }, [user])

  function removeActive(id: string) {
    setActive(prev => prev.filter(a => a.id !== id))
  }

  const empty = !loading && active.length === 0 && completed.length === 0

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Apartados</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px', lineHeight: 1.5 }}>
        Tus figuras están reservadas. Paga el saldo cuando estés listo.
      </p>

      {loading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
          Cargando apartados…
        </div>
      ) : empty ? (
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
          {active.map(ap => (
            <ApartadoCard key={ap.id} ap={ap} onRemove={removeActive} />
          ))}
          {completed.map(ap => (
            <CompletedCard key={ap.id} ap={ap} />
          ))}
        </div>
      )}

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
