'use client'

import { useRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react'

type Animation = 'fade-up' | 'fade-in' | 'fade-right' | 'scale-in' | 'pop-in'

interface Props {
  children:  ReactNode
  animation?: Animation
  delay?:    number          // ms
  duration?: number          // ms
  threshold?: number         // 0-1 how much of element must be visible
  className?: string
  style?:    CSSProperties
  as?:       'div' | 'section' | 'article' | 'li' | 'span' | 'header' | 'footer'
}

const HIDDEN: Record<Animation, CSSProperties> = {
  'fade-up':    { opacity: 0, transform: 'translateY(28px)' },
  'fade-in':    { opacity: 0 },
  'fade-right': { opacity: 0, transform: 'translateX(-20px)' },
  'scale-in':   { opacity: 0, transform: 'scale(0.88)' },
  'pop-in':     { opacity: 0, transform: 'scale(0.72)' },
}

const VISIBLE: Record<Animation, CSSProperties> = {
  'fade-up':    { opacity: 1, transform: 'translateY(0)' },
  'fade-in':    { opacity: 1 },
  'fade-right': { opacity: 1, transform: 'translateX(0)' },
  'scale-in':   { opacity: 1, transform: 'scale(1)' },
  'pop-in':     { opacity: 1, transform: 'scale(1)' },
}

export default function Reveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 520,
  threshold = 0.12,
  className = '',
  style,
  as: Tag = 'div',
}: Props) {
  const ref     = useRef<HTMLElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Already in view (e.g. above fold)
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * (1 - threshold)) {
      setVis(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVis(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  const hiddenStyle  = HIDDEN[animation]
  const visibleStyle = VISIBLE[animation]
  const easing = animation === 'pop-in'
    ? 'cubic-bezier(.32,.72,0,1)'
    : 'cubic-bezier(.4,0,.2,1)'

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={className}
      style={{
        ...style,
        ...(vis ? visibleStyle : hiddenStyle),
        transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </Tag>
  )
}
