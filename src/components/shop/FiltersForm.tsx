'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react'
import { IconClose } from '../icons'

/**
 * The shop's filters live in a panel that slides in from the side, so the page itself stays calm:
 * a count, a Filter button, a sort menu and the suits.
 *
 * With JavaScript, any change updates the results straight away. Without it, the form submits normally.
 */
export function FiltersForm({ basePath, bar, panel, count, activeCount, children }: { basePath: string; bar: ReactNode; panel: ReactNode; count: number; activeCount: number; children: ReactNode }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const apply = () => {
    const form = formRef.current
    if (!form) return
    const params = new URLSearchParams()
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === 'string' && value !== '') params.append(key, value)
    }
    const qs = params.toString()
    startTransition(() => router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false }))
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <form
      ref={formRef}
      method="get"
      action={basePath}
      onChange={apply}
      onSubmit={(e) => {
        e.preventDefault()
        apply()
        setOpen(false)
      }}
    >
      <div className="shopbar">
        <button type="button" className="shopbar-filter" aria-expanded={open} onClick={() => setOpen(true)}>
          Filter{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        {bar}
      </div>

      <div className="scrim" data-open={open} onClick={() => setOpen(false)} aria-hidden />
      <aside className="drawer drawer-left filters-drawer" data-open={open} aria-label="Filters" inert={!open}>
        <div className="drawer-head">
          <span className="drawer-title">Filter</span>
          <button type="button" className="iconbtn" onClick={() => setOpen(false)} aria-label="Close filters">
            <IconClose />
          </button>
        </div>
        <div className="drawer-body">{panel}</div>
        <div className="drawer-foot">
          <button type="submit" className="btn btn-gold btn-block">
            {pending ? 'Updating…' : `Show ${count} ${count === 1 ? 'suit' : 'suits'}`}
          </button>
        </div>
      </aside>

      <div aria-busy={pending} style={{ opacity: pending ? 0.5 : 1, transition: 'opacity .2s' }}>
        {children}
      </div>
    </form>
  )
}
