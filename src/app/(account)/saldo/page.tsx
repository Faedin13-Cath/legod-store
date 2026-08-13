'use client'

import { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'

const AMOUNTS = [200, 500, 1000, 2000]

type Transaction = {
  id: string
  type: 'topup' | 'gift_sent' | 'gift_received' | 'spent'
  amount: number
  description: string
  created_at: string
}

export default function SaldoPage() {
  const { user } = useAuth()
  const [balance,  setBalance]  = useState<number | null>(null)
  const [txns,     setTxns]     = useState<Transaction[]>([])
  const [loading,  setLoading]  = useState(true)

  const [topupAmt,     setTopupAmt]     = useState(500)
  const [topupLoading, setTopupLoading] = useState(false)

  const [recipient,   setRecipient]   = useState('')
  const [giftAmt,     setGiftAmt]     = useState(500)
  const [giftLoading, setGiftLoading] = useState(false)
  const [giftError,   setGiftError]   = useState('')
  const [giftSent,    setGiftSent]    = useState(false)

  const loadBalance = useCallback(async () => {
    const res = await fetch('/api/balance')
    if (res.ok) {
      const d = await res.json()
      setBalance(d.balance)
      setTxns(d.transactions)
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (user) loadBalance() }, [user, loadBalance])

  async function handleTopup() {
    setTopupLoading(true)
    try {
      const res  = await fetch('/api/balance/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: topupAmt }),
      })
      const data = await res.json()
      if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank')
    } finally {
      setTopupLoading(false)
    }
  }

  async function handleGift() {
    setGiftError('')
    if (!recipient.trim()) { setGiftError('Ingresa un correo o @usuario'); return }
    setGiftLoading(true)
    try {
      const res  = await fetch('/api/balance/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: giftAmt, recipient: recipient.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setGiftError(data.error ?? 'Error al enviar'); return }
      if (data.checkoutUrl) window.open(data.checkoutUrl, '_blank')
      setGiftSent(true)
      setRecipient('')
    } finally {
      setGiftLoading(false)
    }
  }

  const txnColor = (type: Transaction['type']) =>
    (type === 'topup' || type === 'gift_received') ? '#22C55E' : '#EF4444'
  const txnSign  = (type: Transaction['type']) =>
    (type === 'topup' || type === 'gift_received') ? '+' : '-'

  const amtBtn = (a: number, sel: number, set: (v: number) => void, sm?: boolean) => (
    <button key={a} onClick={() => set(a)} style={{
      padding: sm ? '8px 6px' : '12px 8px',
      borderRadius: 10, fontSize: sm ? 13 : 15, fontWeight: 700,
      background: sel === a ? 'var(--accent)' : 'var(--cream)',
      color:      sel === a ? '#fff'          : 'var(--ink)',
      border:     `1px solid ${sel === a ? 'var(--accent)' : 'var(--line)'}`,
      cursor: 'pointer', transition: 'all .12s',
    }}>
      ${a.toLocaleString('es-MX')}
      {!sm && <span style={{ display: 'block', fontSize: 10, fontWeight: 400, opacity: 0.7 }}>MXN</span>}
    </button>
  )

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Mi saldo</h1>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px' }}>
        Recarga tu cartera, regala saldo o úsalo en tus compras.
      </p>

      {/* Balance pill */}
      <div style={{
        background: 'var(--accent)', color: '#fff',
        borderRadius: 20, padding: '28px 32px',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Saldo disponible</div>
        <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
          {loading ? '—' : `$${(balance ?? 0).toLocaleString('es-MX')}`}
          <small style={{ fontSize: 16, fontWeight: 400, marginLeft: 6, opacity: 0.7 }}>MXN</small>
        </div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>Se aplica automáticamente en tu próxima compra</div>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Recargar + Gift card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>

        {/* Recargar */}
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ color: 'var(--accent)' }}><Icon name="sparkle" size={17} /></span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Recargar saldo</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 12 }}>
            {AMOUNTS.map(a => amtBtn(a, topupAmt, setTopupAmt))}
          </div>
          <button onClick={handleTopup} disabled={topupLoading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {topupLoading ? 'Redirigiendo…' : `Recargar $${topupAmt.toLocaleString('es-MX')} →`}
          </button>
        </div>

        {/* Gift card */}
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ color: 'var(--accent)' }}><Icon name="gift" size={17} /></span>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>Enviar gift card</span>
          </div>
          {giftSent ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>🎁</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534', marginBottom: 4 }}>¡Gift card enviada!</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>El saldo se acreditará al destinatario cuando confirmen el pago.</div>
              <button onClick={() => setGiftSent(false)} className="btn btn-secondary btn-sm">Enviar otra</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 9 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 4 }}>
                  Destinatario (correo o @usuario)
                </label>
                <input
                  type="text"
                  placeholder="usuario@email.com o @legofan"
                  value={recipient}
                  onChange={e => { setRecipient(e.target.value); setGiftError('') }}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                {AMOUNTS.map(a => amtBtn(a, giftAmt, setGiftAmt, true))}
              </div>
              {giftError && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 7 }}>{giftError}</div>}
              <button onClick={handleGift} disabled={giftLoading} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                {giftLoading ? 'Procesando…' : `Regalar $${giftAmt.toLocaleString('es-MX')} →`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Historial de movimientos</div>
        {loading ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>Cargando…</div>
        ) : txns.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center' }}>
            <div style={{ color: 'var(--ink-4)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
              <Icon name="gift-card" size={28} />
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>Aún no tienes movimientos.</div>
          </div>
        ) : (
          <div>
            {txns.map((t, i) => (
              <div key={t.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: i < txns.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{t.description}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: txnColor(t.type) }}>
                  {txnSign(t.type)}${t.amount.toLocaleString('es-MX')} MXN
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
