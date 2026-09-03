'use client'

import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import { faqs } from '@/lib/data'

const extraFaqs = [
  { sec: 'Estado de las figuras', items: [
    { q: '¿Qué significa "nuevo"?', a: 'Pieza sin uso, tal como sale de fábrica o sin ningún tipo de marca, roce ni desgaste.' },
    { q: '¿Qué significa "perfecto"?', a: 'Pieza de segunda mano en estado impecable, sin marcas visibles ni desgaste.' },
    { q: '¿Qué significa "con detalle"?', a: 'La pieza no está perfecta: puede ser un crack en el torso, una pieza cambiada (brazos o piernas de otro color) o algo despintado. Cuál es el detalle viene escrito en la ficha del producto, y siempre hay fotos. El precio ya lo refleja.' },
    { q: '¿Qué significa "sin accesorios"?', a: 'La figura está completa pero le falta algún accesorio (varita, arma, capa, etc.). Se especifica en la descripción.' },
  ]},
  { sec: 'Véndenos', items: [
    { q: '¿Cómo funciona el proceso de venta?', a: 'Nos mandas fotos de tu colección por WhatsApp o Instagram, te damos cotización en 24h y, si aceptas, te decimos cómo enviarnos las piezas. Pagamos por transferencia.' },
    { q: '¿Qué piezas aceptan?', a: 'Minifiguras originales LEGO en estado nuevo, perfecto o con crack leve. Sets sellados o con muy pocas piezas faltantes. No aceptamos piezas sueltas sin clasificar en mal estado.' },
  ]},
  { sec: 'Rock Show', items: [
    { q: '¿Puedo recoger en persona en el Roc?', a: 'Sí. Si vas al Rock Show en CDMX puedes recoger tus pedidos o apartar nuevas figuras directamente. Avísanos por DM antes del evento.' },
    { q: '¿Hay descuento por comprar en el evento?', a: 'No manejamos descuentos de evento, pero puedes ver la mercancía en persona antes de decidir.' },
  ]},
]

const allFaqs = [...faqs, ...extraFaqs]

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null)

  function toggle(key: string) {
    setOpen(prev => prev === key ? null : key)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' }}>
            Preguntas frecuentes
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0, lineHeight: 1.6 }}>
            Respuestas a las dudas más comunes. Si no encuentras lo que buscas,{' '}
            <Link href="/contacto" style={{ color: 'var(--accent)', fontWeight: 500 }}>escríbenos</Link>.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {allFaqs.map(section => (
            <div key={section.sec}>
              <h2 style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--ink-3)',
                margin: '0 0 14px', paddingBottom: 10,
                borderBottom: '1px solid var(--line)',
              }}>
                {section.sec}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {section.items.map((item, idx) => {
                  const key = `${section.sec}-${idx}`
                  const isOpen = open === key
                  return (
                    <div
                      key={key}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => toggle(key)}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '16px 0',
                          background: 'none', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>
                          {item.q}
                        </span>
                        <span style={{
                          flexShrink: 0, color: 'var(--ink-3)',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform .2s',
                        }}>
                          <Icon name="chevron-down" size={16} />
                        </span>
                      </button>
                      {isOpen && (
                        <div style={{
                          paddingBottom: 16, fontSize: 14,
                          color: 'var(--ink-2)', lineHeight: 1.7,
                        }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div style={{
          marginTop: 56, padding: '28px 32px',
          background: 'var(--paper)', border: '1px solid var(--line)',
          borderRadius: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              ¿No encontraste respuesta?
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
              Escríbenos por Instagram, WhatsApp o correo.
            </div>
          </div>
          <Link href="/contacto" className="btn btn-primary" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Contactar
          </Link>
        </div>
      </div>
    </div>
  )
}
