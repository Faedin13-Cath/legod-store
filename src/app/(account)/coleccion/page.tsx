'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import MinifigImage from '@/components/product/MinifigImage'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { getProducts, shopifyToProduct } from '@/lib/shopify'
import type { Product } from '@/types'

const BRICKLINK_IMG = (id: string) =>
  `https://img.bricklink.com/ItemImage/MN/0/${id.toLowerCase()}.png`

const CONDITIONS = [
  { value: 'new',        label: 'Nuevo',      emoji: '✨', color: '#2e7d32', bg: '#e8f5e9' },
  { value: 'perfect',    label: 'Perfecto',   emoji: '💎', color: '#1565c0', bg: '#e3f2fd' },
  { value: 'crack',      label: 'Con crack',  emoji: '⚡', color: '#b45309', bg: '#fef3c7' },
  { value: 'incomplete', label: 'Incompleto', emoji: '🧩', color: '#7c3aed', bg: '#ede9fe' },
]

const BL_TAGS: Record<string, string> = {
  sh: 'Super Heroes', sw: 'Star Wars', hp: 'Harry Potter',
  njo: 'Ninjago', cty: 'City', col: 'Collectible', cas: 'Castle',
  sp: 'Space', pi: 'Pirates', tlm: 'The LEGO Movie',
  dis: 'Disney', jw: 'Jurassic World', lor: 'El Señor de los Anillos',
  idea: 'Ideas', min: 'Minions', mar: 'Marvel', vik: 'Vikings',
}

type CollectionItem = {
  id: string
  handle: string
  source: string
  custom_name: string | null
  qty: number
  condition: string
  product?: Product
}

const getName = (i: CollectionItem) => i.custom_name ?? i.product?.name ?? i.handle
const getTag  = (i: CollectionItem) => {
  if (i.product?.tag) return i.product.tag
  const prefix = i.handle.replace(/\d.*$/, '').toLowerCase()
  return BL_TAGS[prefix] ?? 'Colección'
}

export default function ColeccionPage() {
  const router   = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [items,          setItems]          = useState<CollectionItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [showAdd,        setShowAdd]        = useState(false)
  const [editMode,       setEditMode]       = useState(false)
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null)

  // BrickLink add form
  const [blNum,    setBlNum]    = useState('')
  const [blName,   setBlName]   = useState('')
  const [blImgOk,  setBlImgOk] = useState<boolean | null>(null)
  const [blCond,   setBlCond]   = useState('perfect')
  const [blQty,    setBlQty]    = useState(1)
  const [saving,   setSaving]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([
      supabase.from('collection_items').select('*').eq('user_id', user.id).order('added_at', { ascending: false }),
      getProducts().then(ps => ps.map(shopifyToProduct)),
    ]).then(([{ data: rows }, products]) => {
      const map = Object.fromEntries((products ?? []).map(p => [p.id, p]))
      setItems((rows ?? []).map(r => ({
        id:          r.id,
        handle:      r.handle,
        source:      r.source ?? 'shopify',
        custom_name: r.custom_name ?? null,
        qty:         r.qty,
        condition:   r.condition,
        product:     map[r.handle],
      })))
    }).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    setBlImgOk(null)
    if (!blNum.trim()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const img = new Image()
      img.onload = () => {
        setBlImgOk(true)
        fetch(`/api/bricklink?id=${encodeURIComponent(blNum.trim())}`)
          .then(r => r.json())
          .then(data => { if (data.name) setBlName(data.name) })
          .catch(() => {})
      }
      img.onerror = () => setBlImgOk(false)
      img.src = BRICKLINK_IMG(blNum.trim())
    }, 600)
  }, [blNum])

  async function addBrickLink() {
    if (!user || !blNum.trim() || !blName.trim()) return
    setSaving(true)
    const handle = blNum.trim().toLowerCase()
    const { data } = await supabase.from('collection_items').insert({
      user_id: user.id, handle, source: 'bricklink',
      custom_name: blName.trim(), qty: blQty, condition: blCond,
    }).select().single()
    if (data) setItems(prev => [{ id: data.id, handle: data.handle, source: 'bricklink', custom_name: data.custom_name, qty: data.qty, condition: data.condition }, ...prev])
    setBlNum(''); setBlName(''); setBlQty(1); setBlCond('perfect'); setBlImgOk(null)
    setShowAdd(false); setSaving(false)
  }

  async function updateQty(item: CollectionItem, delta: number) {
    const newQty = Math.max(1, item.qty + delta)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, qty: newQty } : i))
    await supabase.from('collection_items').update({ qty: newQty }).eq('id', item.id)
  }

  async function updateCondition(item: CollectionItem, condition: string) {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, condition } : i))
    await supabase.from('collection_items').update({ condition }).eq('id', item.id)
  }

  async function confirmAndRemove(item: CollectionItem) {
    setItems(prev => prev.filter(i => i.id !== item.id))
    setConfirmDelete(null)
    await supabase.from('collection_items').delete().eq('id', item.id)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(i =>
      getName(i).toLowerCase().includes(q) || i.handle.toLowerCase().includes(q)
    )
  }, [items, search])

  const totalPiezas = items.reduce((s, i) => s + i.qty, 0)
  const totalValor  = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.qty, 0)
  const totalCats   = new Set(items.map(i => i.product?.cat).filter(Boolean)).size

  if (loading) return <div style={{ padding: '56px', textAlign: 'center', color: 'var(--ink-3)' }}>Cargando…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Mi colección</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
            {totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'} · {items.length} {items.length === 1 ? 'figura' : 'figuras'} distintas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {items.length > 0 && (
            <button
              onClick={() => { setEditMode(v => !v); setConfirmDelete(null) }}
              className={`btn ${editMode ? 'btn-danger' : 'btn-secondary'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
            >
              {editMode ? '✓ Listo' : '✏️ Editar'}
            </button>
          )}
          <button
            onClick={() => setShowAdd(v => !v)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 18px' }}
          >
            <Icon name="plus" size={13} /> Agregar
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--accent)', borderRadius: 16, padding: '20px 24px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>Agregar por número BrickLink</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16 }}>
            Ej: <code style={{ background: 'var(--cream)', padding: '1px 5px', borderRadius: 4 }}>sh0367</code>,{' '}
            <code style={{ background: 'var(--cream)', padding: '1px 5px', borderRadius: 4 }}>sw0001</code>,{' '}
            <code style={{ background: 'var(--cream)', padding: '1px 5px', borderRadius: 4 }}>hp001</code>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ width: 100, height: 100, borderRadius: 12, border: '1px solid var(--line)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {blNum && blImgOk === true && <img src={BRICKLINK_IMG(blNum)} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />}
              {blNum && blImgOk === false && <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', padding: 8 }}>No encontrado</div>}
              {(!blNum || blImgOk === null) && <div style={{ fontSize: 24 }}>🧱</div>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Número BrickLink *</label>
                  <input value={blNum} onChange={e => setBlNum(e.target.value)} placeholder="sh0367"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${blImgOk === false ? 'var(--danger)' : 'var(--line)'}`, fontSize: 13, background: 'var(--paper)', color: 'var(--ink)', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
                  <input value={blName} readOnly placeholder="Se completa automático…"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--cream)', color: blName ? 'var(--ink)' : 'var(--ink-4)', boxSizing: 'border-box', outline: 'none', cursor: 'default' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</label>
                  <select value={blCond} onChange={e => setBlCond(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: 'var(--paper)', color: 'var(--ink)', boxSizing: 'border-box' }}>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cantidad</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => setBlQty(q => Math.max(1, q - 1))} style={{ width: 32, height: 36, background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-2)' }}>−</button>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{blQty}</span>
                    <button onClick={() => setBlQty(q => q + 1)} style={{ width: 32, height: 36, background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-2)' }}>+</button>
                  </div>
                </div>
                <button onClick={addBrickLink} disabled={saving || !blNum.trim() || !blName.trim()}
                  className="btn btn-primary" style={{ padding: '8px 20px', opacity: (!blNum.trim() || !blName.trim()) ? 0.5 : 1 }}>
                  {saving ? 'Guardando…' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Total de piezas', value: totalPiezas.toLocaleString('es-MX'),          emoji: '📦' },
              { label: 'Valor estimado',  value: `$${totalValor.toLocaleString('es-MX')} MXN`, emoji: '💰' },
              { label: 'Categorías',      value: totalCats.toString(),                          emoji: '🏷️' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--cream)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.emoji}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={14} /></span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en mi colección…"
              style={{ paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', borderRadius: 8, fontSize: 13, background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {filtered.map(item => {
              const cond        = CONDITIONS.find(c => c.value === item.condition) ?? CONDITIONS[1]
              const isBL        = item.source === 'bricklink'
              const isConfirm   = confirmDelete === item.id

              return (
                <div key={item.id} style={{
                  background: 'var(--paper)',
                  border: `1px solid ${isConfirm ? '#ef4444' : 'var(--line)'}`,
                  borderRadius: 18, overflow: 'hidden',
                  transition: 'border-color .15s',
                }}>

                  {/* Image */}
                  <div style={{ position: 'relative', paddingTop: '100%', background: '#fff', cursor: item.product ? 'pointer' : 'default' }}
                    onClick={() => !editMode && item.product && router.push(`/tienda/${item.product.id}`)}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.product
                        ? <MinifigImage product={item.product} />
                        : isBL
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={BRICKLINK_IMG(item.handle)} alt={getName(item)} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} />
                          : <div style={{ fontSize: 36 }}>🧱</div>
                      }
                    </div>

                    {/* Condition badge */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '5px 8px', textAlign: 'center',
                      background: cond.bg,
                      borderTop: `1px solid ${cond.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}>
                      <span style={{ fontSize: 12 }}>{cond.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: cond.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{cond.label}</span>
                    </div>

                    {/* Delete button — only in edit mode */}
                    {editMode && !isConfirm && (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(item.id) }}
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#ef4444', border: 'none',
                          color: '#fff', fontSize: 15, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
                        }}
                      >×</button>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 1, lineHeight: 1.3 }}>{getName(item)}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{getTag(item)}</div>

                    {/* Delete confirmation inline */}
                    {isConfirm ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, margin: 0, textAlign: 'center' }}>
                          ¿Eliminar esta figura?
                        </p>
                        <button
                          onClick={() => confirmAndRemove(item)}
                          style={{ width: '100%', padding: '7px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{ width: '100%', padding: '7px', borderRadius: 8, background: 'var(--cream)', color: 'var(--ink-2)', border: '1px solid var(--line)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Qty */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>Cantidad</span>
                          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
                            <button onClick={() => updateQty(item, -1)} style={{ width: 26, height: 26, background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ width: 28, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{item.qty}</span>
                            <button onClick={() => updateQty(item, +1)} style={{ width: 26, height: 26, background: 'var(--cream)', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        </div>

                        {/* Condition */}
                        <select value={item.condition} onChange={e => updateCondition(item, e.target.value)} onClick={e => e.stopPropagation()}
                          style={{ width: '100%', padding: '5px 8px', borderRadius: 7, fontSize: 11, fontWeight: 500, background: 'var(--cream)', color: 'var(--ink-2)', border: '1px solid var(--line)', cursor: 'pointer', marginBottom: 8 }}>
                          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                        </select>

                        {item.product && (
                          <a href={`/vendenos?fig=${item.product.id}`} onClick={e => e.stopPropagation()}
                            style={{ display: 'block', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', padding: '4px 0' }}>
                            Vender esta figura →
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Empty state */}
      {items.length === 0 && !showAdd && (
        <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '56px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Tu colección está vacía</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px', lineHeight: 1.6 }}>
            Agrega cualquier figura LEGO por su número de BrickLink.
          </p>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary">Agregar primera figura</button>
        </div>
      )}
    </div>
  )
}
