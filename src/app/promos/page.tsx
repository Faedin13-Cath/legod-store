'use client'

import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import Dragon from '@/components/ui/Dragon'

const CODE = 'TEAMOLEGOD'

const PRIZES = [
  'Vecna',
  'Slinky Dog',
  'Beast (Bestia)',
  'Moon Knight',
  'Clone Commander Bly',
  'Remanente Imperial',
  'Mando UCS N-1',
]

export default function PromosPage() {
  const [copied, setCopied] = useState(false)

  function copyCode() {
    navigator.clipboard?.writeText(CODE).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px 90px' }}>

        {/* ── Hero aniversario ── */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 28, padding: '56px 40px', textAlign: 'center',
        }}>
          <Dragon style={{ position: 'absolute', left: '-8%', top: '10%', width: '55%', color: 'var(--accent)', opacity: 0.08, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', margin: '0 0 10px' }}>
              Celebramos
            </p>
            <h1 style={{ fontSize: 'clamp(40px, 9vw, 84px)', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 0.95, margin: '0 0 6px' }}>
              1 AÑO
            </h1>
            <h2 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', margin: '0 0 16px' }}>
              de LEGOD 🎉
            </h2>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 460, margin: '0 auto', lineHeight: 1.6 }}>
              Un año gracias a ti. Lo celebramos <strong>a lo grande</strong> con descuento
              y una rifa de figuras para nuestra comunidad.
            </p>
          </div>
        </div>

        {/* ── Cupón ── */}
        <div style={{
          marginTop: 20, background: 'linear-gradient(135deg, var(--accent) 0%, #4A1D8F 100%)',
          borderRadius: 24, padding: '32px 28px', color: '#fff', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <Dragon style={{ position: 'absolute', right: '-6%', bottom: '-20%', width: '42%', color: '#fff', opacity: 0.1, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>10% OFF</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: '8px 0 20px' }}>
              en toda la tienda con el código:
            </p>

            <button
              onClick={copyCode}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.14)', border: '2px dashed rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 24px', cursor: 'pointer',
                color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '0.08em',
              }}
            >
              {CODE}
              <span style={{ fontSize: 12, fontWeight: 600, background: '#fff', color: 'var(--accent)', padding: '4px 10px', borderRadius: 8, letterSpacing: 0 }}>
                {copied ? '¡Copiado!' : 'Copiar'}
              </span>
            </button>

            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '18px 0 0', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="clock" size={14} /> Válido hasta el 3 de septiembre de 2026
            </p>

            <Link href="/tienda" className="btn" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 22,
              background: '#fff', color: 'var(--accent)', padding: '12px 28px',
              borderRadius: 999, textDecoration: 'none', fontSize: 15, fontWeight: 700,
            }}>
              Ir a la tienda <Icon name="chevron-right" size={14} />
            </Link>
          </div>
        </div>

        {/* ── Rifa ── */}
        <div style={{ marginTop: 20, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 24, padding: '32px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>🎁</span>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Rifa de aniversario</h3>
          </div>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 20px' }}>
            Participa para <strong>ganar una figura gratis</strong>. Sorteamos entre nuestra comunidad
            estas piezas:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 24 }}>
            {PRIZES.map(p => (
              <div key={p} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--cream)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0 }}><Icon name="sparkle" size={16} /></span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 14, padding: '16px 18px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--ink)' }}>¿Cómo participo?</strong><br />
            Haz una compra durante la celebración y quedas dentro de la rifa automáticamente.
            Anunciaremos a los ganadores en nuestras redes.
          </div>
        </div>

      </div>
    </div>
  )
}
