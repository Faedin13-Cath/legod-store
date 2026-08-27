'use client'

import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'

export default function PerfilPage() {
  const { profile, refreshProfile } = useAuth()
  const supabase = createClient()

  const [name,   setName]   = useState('')
  const [handle, setHandle] = useState('')
  const [email,  setEmail]  = useState('')
  const [wa,     setWa]     = useState('')
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')
  const [busy,   setBusy]   = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '')
      setHandle(profile.handle ?? '')
      setEmail(profile.email ?? '')
      setWa(profile.whatsapp ?? '')
    }
  }, [profile])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = await supabase
      .from('profiles')
      .update({ name, handle: handle.toLowerCase().replace(/\s+/g, ''), email, whatsapp: wa })
      .eq('id', profile!.id)
    setBusy(false)
    if (error) { setError(error.message); return }
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 24px' }}>Mi perfil</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Account info */}
        <section style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
            Información personal
          </h2>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
              <input value={name} onChange={e => setName(e.target.value)} className="input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Handle</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', fontSize: 14 }}>@</span>
                <input value={handle} onChange={e => setHandle(e.target.value)} className="input" style={{ width: '100%', paddingLeft: 26 }} />
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="input" style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <button type="submit" disabled={busy} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {saved ? <><Icon name="check" size={14} /> Guardado</> : busy ? 'Guardando…' : 'Guardar cambios'}
              </button>
              {saved && <span style={{ fontSize: 13, color: 'var(--success)' }}>✓ Cambios guardados</span>}
            </div>
          </form>
        </section>

        {/* Notification channels */}
        <section style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>
            Canales de notificación
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}><Icon name="whatsapp" size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, fontWeight: 500 }}>WhatsApp</div>
                <input value={wa} onChange={e => setWa(e.target.value)} placeholder="+52 55 ..." className="input" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}><Icon name="user" size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, fontWeight: 500 }}>Email</div>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder={email} className="input" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { label: 'Puntos acumulados', value: profile?.points_total?.toLocaleString('es-MX') ?? '0' },
            { label: 'Próxima recompensa', value: `${profile?.points_next_reward?.toLocaleString('es-MX') ?? '1500'} pts` },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--paper)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '16px 20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
