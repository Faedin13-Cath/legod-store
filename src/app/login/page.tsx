'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase/client'

type View = 'login' | 'register' | 'forgot'

export default function LoginPage() {
  const [view,    setView]    = useState<View>('login')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [busy,    setBusy]    = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    setBusy(false)
    if (error) { setError(error.message); return }
    router.push('/perfil')
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/login` },
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/perfil`,
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  function switchView(v: View) {
    setView(v); setSent(false); setError('')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--paper)', border: '1px solid var(--line)',
        borderRadius: 24, overflow: 'hidden',
      }}>
        {/* Logo header */}
        <div style={{
          padding: '32px 36px 24px', textAlign: 'center',
          borderBottom: '1px solid var(--line)',
        }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/assets/logo/legod-logo-violet.png" alt="LEGOD" width={40} height={40} style={{ borderRadius: '50%' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--ink)' }}>Jango&apos;s Store</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Jango&apos;s Store</div>
            </div>
          </Link>
        </div>

        <div style={{ padding: '28px 36px 36px' }}>
          {/* Tabs */}
          {view !== 'forgot' && (
            <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderBottom: '1px solid var(--line)' }}>
              {(['login', 'register'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  style={{
                    flex: 1, padding: '8px 0', background: 'none', border: 'none',
                    fontSize: 14, fontWeight: view === v ? 600 : 400,
                    color: view === v ? 'var(--ink)' : 'var(--ink-3)',
                    borderBottom: `2px solid ${view === v ? 'var(--accent)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all .15s', marginBottom: -1,
                  }}
                >
                  {v === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10,
              padding: '10px 14px', marginBottom: 14,
              fontSize: 13, color: '#DC2626',
            }}>
              {error}
            </div>
          )}

          {/* Login form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input
                  required type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input" style={{ width: '100%' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                  <button type="button" onClick={() => switchView('forgot')} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    required type={showPw ? 'text' : 'password'} value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="input" style={{ width: '100%', paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'flex' }}>
                    <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
                  </button>
                </div>
              </div>
              <button type="submit" disabled={busy} className="btn btn-primary" style={{ marginTop: 4, height: 44, fontSize: 15 }}>
                {busy ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          )}

          {/* Register form */}
          {view === 'register' && !sent && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                <input
                  required type="text" value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="input" style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input
                  required type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input" style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    required type={showPw ? 'text' : 'password'} value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    className="input" style={{ width: '100%', paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', display: 'flex' }}>
                    <Icon name={showPw ? 'eye-off' : 'eye'} size={16} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>
                Al crear una cuenta aceptas nuestros{' '}
                <Link href="#" style={{ color: 'var(--accent)' }}>Términos</Link>{' '}y{' '}
                <Link href="#" style={{ color: 'var(--accent)' }}>Política de Privacidad</Link>.
              </p>
              <button type="submit" disabled={busy} className="btn btn-primary" style={{ marginTop: 4, height: 44, fontSize: 15 }}>
                {busy ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>
          )}

          {view === 'register' && sent && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--success-bg)', border: '1px solid var(--success-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--success)',
              }}>
                <Icon name="check" size={22} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>¡Cuenta creada!</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.5 }}>
                Revisa tu correo para confirmar tu cuenta.
              </p>
              <button onClick={() => switchView('login')} className="btn btn-secondary" style={{ width: '100%' }}>
                Ir al inicio de sesión
              </button>
            </div>
          )}

          {/* Forgot password */}
          {view === 'forgot' && !sent && (
            <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ marginBottom: 6 }}>
                <button type="button" onClick={() => switchView('login')} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
                  <Icon name="chevron-left" size={14} /> Volver
                </button>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Recuperar contraseña</h2>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 4px', lineHeight: 1.5 }}>
                Te mandamos un enlace para restablecer tu contraseña.
              </p>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-3)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                <input
                  required type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="input" style={{ width: '100%' }}
                />
              </div>
              <button type="submit" disabled={busy} className="btn btn-primary" style={{ height: 44, fontSize: 15 }}>
                {busy ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}

          {view === 'forgot' && sent && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--accent)',
              }}>
                <Icon name="bell" size={22} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>¡Enlace enviado!</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 20px', lineHeight: 1.5 }}>
                Revisa tu correo y sigue las instrucciones. El enlace expira en 1 hora.
              </p>
              <button onClick={() => switchView('login')} className="btn btn-secondary" style={{ width: '100%' }}>
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
