'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * Lets a block settle into place the first time it scrolls into view.
 *
 * Content is always visible without JavaScript and for visitors who prefer reduced motion: the hidden
 * starting state only applies once this component has mounted and confirmed it can observe scrolling.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' | 'header' }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Already on screen when the page loads: leave it alone rather than hide and re-show it.
    const box = el.getBoundingClientRect()
    if (box.top < window.innerHeight * 0.92) return
    el.dataset.reveal = 'wait'
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.reveal = 'in'
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const Component = Tag as 'div'
  return (
    <Component ref={ref as React.Ref<HTMLDivElement>} className={className} style={delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined}>
      {children}
    </Component>
  )
}
