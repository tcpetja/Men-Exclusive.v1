'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * A hairline of gold across the top of the screen while the next page loads, so a tap is always
 * acknowledged straight away, even on a slow mobile connection.
 */
export function NavProgress() {
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A page has arrived.
  useEffect(() => {
    setState((s) => (s === 'loading' ? 'done' : s))
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 450)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [pathname, search])

  // A link to another page on this site was activated.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      setState('loading')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return <div className="navprogress" data-state={state} aria-hidden />
}
