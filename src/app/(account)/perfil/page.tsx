'use client'

import { useState } from 'react'
import Icon from '@/components/ui/Icon'
import { sampleUser } from '@/lib/data'

export default function PerfilPage() {
  const user = sampleUser
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
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
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
              <input defaultValue={user.name} className="input" style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Handle</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)', fontSize: 14 }}>@</span>
                <input defaultValue={user.handle} className="input" style={{ width: '100%', paddingLeft: 26 }} />
              </div>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input defaultValue={user.email} type="email" className="input" style={{ width: '100%' }} />
            </div>

            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                {saved ? <><Icon name="check" size={14} /> Guardado</> : 'Guardar cambios'}
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
            {[
              { icon: 'whatsapp', label: 'WhatsApp', placeholder: '+52 55 ...', value: user.channels.whatsapp ?? '' },
              { icon: 'user',     label: 'Email',     placeholder: user.email,  value: user.channels.email ?? user.email },
            ].map(ch => (
              <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}><Icon name={ch.icon as never} size={18} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, fontWeight: 500 }}>{ch.label}</div>
                  <input defaultValue={ch.value} placeholder={ch.placeholder} className="input" style={{ width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section style={{
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>
            Privacidad del perfil
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { value: 'public',    label: 'Público', desc: 'Cualquiera puede ver tu perfil y colección' },
              { value: 'link-only', label: 'Solo con link', desc: 'Solo quien tenga el link directo puede verlo' },
              { value: 'private',   label: 'Privado', desc: 'Solo tú puedes ver tu perfil' },
            ].map(opt => (
              <label key={opt.value} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${user.profilePublic === opt.value ? 'var(--accent)' : 'var(--line)'}`,
                background: user.profilePublic === opt.value ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer',
              }}>
                <input
                  type="radio" name="privacy" defaultValue={opt.value}
                  defaultChecked={user.profilePublic === opt.value}
                  style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'En colección', value: user.collection.length },
            { label: 'En wishlist',  value: user.wishlist.length },
            { label: 'Pedidos',      value: user.orders.length },
            { label: 'Puntos',       value: user.pointsTotal.toLocaleString('es-MX') },
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
