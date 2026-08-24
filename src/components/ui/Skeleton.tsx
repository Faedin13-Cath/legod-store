export function Skeleton({ w, h, r = 8, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width: w ?? '100%', height: h ?? 12, borderRadius: r, ...style }} />
}

/** Placeholder que imita una ProductCard mientras cargan los productos. */
export function ProductCardSkeleton() {
  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>
      <div className="skeleton" style={{ width: '100%', aspectRatio: '1/1', borderRadius: 0 }} />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton w="70%" h={13} />
        <Skeleton w="40%" h={10} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Skeleton w={60} h={16} />
          <Skeleton w={30} h={30} r={999} />
        </div>
      </div>
    </div>
  )
}

/** Grid de skeletons para la tienda / listados. */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </>
  )
}
