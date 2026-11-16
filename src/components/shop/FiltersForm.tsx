'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition, type ReactNode } from 'react'

/**
 * Wraps the filter controls in a GET form. With JavaScript, any change updates the results straight away;
 * without it, the "Apply filters" button submits the form normally.
 */
export function FiltersForm({ basePath, bar, panel, children }: { basePath: string; bar: ReactNode; panel: ReactNode; children: ReactNode }) {
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

  return (
    <form
      ref={formRef}
      method="get"
      action={basePath}
      onChange={apply}
      onSubmit={(e) => {
        e.preventDefault()
        apply()
      }}
    >
      <div className="shopbar">
        <button type="button" className="btn btn-line btn-sm filters-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide filters' : 'Filter'}
        </button>
        {bar}
      </div>
      <div className="shop">
        <aside className="filters-panel" data-open={open} aria-label="Filters">
          {panel}
        </aside>
        <div aria-busy={pending} style={{ opacity: pending ? 0.55 : 1, transition: 'opacity .15s' }}>
          {children}
        </div>
      </div>
    </form>
  )
}
