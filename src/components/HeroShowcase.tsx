'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Shot, type ShotImage } from './Shot'

export type ShowcaseItem = { slug: string; name: string; price: string | null; image: ShotImage }

const DWELL_MS = 6500

/**
 * The hero's single spotlight: one suit at a time, changing slowly. One photograph on screen keeps the
 * opening calm; the others wait their turn instead of competing.
 */
export function HeroShowcase({ items }: { items: ShowcaseItem[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (items.length < 2 || paused || still) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % items.length), DWELL_MS)
    return () => clearTimeout(timer)
  }, [index, paused, still, items.length])

  if (items.length === 0) return null
  const current = items[index]

  return (
    <div
      className="showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured suits"
    >
      <div className="showcase-stage">
        {items.map((item, i) => (
          <Link key={item.slug} href={`/shop/${item.slug}`} className="showcase-slide" data-active={i === index} aria-hidden={i !== index} tabIndex={i === index ? 0 : -1}>
            <Shot image={item.image} ratio={4 / 5} zoom={1.24} sizes="(min-width: 900px) 46vw, 96vw" priority={i === 0} />
          </Link>
        ))}
      </div>
      <div className="showcase-foot">
        {items.length > 1 && (
          <div className="showcase-steps">
            {items.map((item, i) => (
              <button key={item.slug} type="button" className="showcase-step" data-state={i === index ? (paused || still ? 'held' : 'running') : i < index ? 'done' : 'todo'} aria-label={`Show ${item.name}`} aria-current={i === index} onClick={() => setIndex(i)}>
                <span style={{ animationDuration: `${DWELL_MS}ms` }} />
              </button>
            ))}
          </div>
        )}
        <p className="showcase-cap" aria-live="polite">
          <Link href={`/shop/${current.slug}`}>{current.name}</Link>
          <span>{current.price ?? 'Price on request'}</span>
        </p>
      </div>
    </div>
  )
}
