import Dragon from '@/components/ui/Dragon'
import type { Product } from '@/types'
import Image from 'next/image'

export default function MinifigImage({ product }: { product: Product }) {
  if (product.photo) {
    return (
      <Image
        src={product.photo}
        alt={product.name}
        fill
        className="object-contain"
        style={{ padding: '12px' }}
        sizes="(max-width: 640px) 50vw, 25vw"
      />
    )
  }

  const c1 = product.fig?.c1 ?? '#7c1d1d'
  const c2 = product.fig?.c2 ?? '#0c2342'

  return (
    <>
      <Dragon className="absolute inset-0 w-full h-full text-accent opacity-10" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* LEGO minifig placeholder — head + neck + torso with arms + legs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'scale(1.3)', userSelect: 'none' }}>

          {/* Head */}
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: '#F5C84A',
            border: '2.5px solid rgba(0,0,0,0.18)',
            position: 'relative',
            zIndex: 2,
          }}>
            {/* Left eye */}
            <div style={{ position: 'absolute', top: 7, left: 5, width: 5, height: 5, borderRadius: '50%', background: '#1A1E5A' }} />
            {/* Right eye */}
            <div style={{ position: 'absolute', top: 7, right: 5, width: 5, height: 5, borderRadius: '50%', background: '#1A1E5A' }} />
            {/* Smile */}
            <div style={{
              position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)',
              width: 14, height: 6,
              borderBottom: '2.5px solid #1A1E5A',
              borderLeft: '2.5px solid #1A1E5A',
              borderRight: '2.5px solid #1A1E5A',
              borderRadius: '0 0 7px 7px',
            }} />
          </div>

          {/* Neck */}
          <div style={{
            width: 12, height: 4,
            background: '#F5C84A',
            borderLeft: '2.5px solid rgba(0,0,0,0.15)',
            borderRight: '2.5px solid rgba(0,0,0,0.15)',
            zIndex: 2,
          }} />

          {/* Torso + arms row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', zIndex: 2 }}>
            {/* Left arm */}
            <div style={{
              width: 9, height: 26,
              background: c1,
              borderRadius: '3px 3px 5px 5px',
              border: '2.5px solid rgba(0,0,0,0.15)',
              marginTop: 3,
              flexShrink: 0,
            }} />
            {/* Torso */}
            <div style={{
              width: 34, height: 36,
              background: c1,
              borderRadius: '3px 3px 0 0',
              border: '2.5px solid rgba(0,0,0,0.15)',
              flexShrink: 0,
            }} />
            {/* Right arm */}
            <div style={{
              width: 9, height: 26,
              background: c1,
              borderRadius: '3px 3px 5px 5px',
              border: '2.5px solid rgba(0,0,0,0.15)',
              marginTop: 3,
              flexShrink: 0,
            }} />
          </div>

          {/* Legs */}
          <div style={{ display: 'flex', gap: 2, zIndex: 2 }}>
            <div style={{
              width: 15, height: 22,
              background: c2,
              borderRadius: '0 0 5px 5px',
              border: '2.5px solid rgba(0,0,0,0.15)',
            }} />
            <div style={{
              width: 15, height: 22,
              background: c2,
              borderRadius: '0 0 5px 5px',
              border: '2.5px solid rgba(0,0,0,0.15)',
            }} />
          </div>
        </div>
      </div>
    </>
  )
}
