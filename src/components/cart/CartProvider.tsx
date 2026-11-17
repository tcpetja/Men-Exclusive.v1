'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/**
 * The shopping bag lives in the browser (localStorage) so it is instant on slow connections and survives a
 * closed tab. It only stores which variant and how many — names, prices and stock always come from the
 * server (see priceCartAction), so nothing in the browser can change what a customer is charged.
 */
export type BagLine = { variantId: string; quantity: number }

type BagContext = {
  lines: BagLine[]
  count: number
  ready: boolean
  add: (variantId: string, quantity: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  swap: (fromVariantId: string, toVariantId: string) => void
  remove: (variantId: string) => void
  clear: () => void
  isOpen: boolean
  open: () => void
  close: () => void
  toast: (message: string) => void
}

const Ctx = createContext<BagContext | null>(null)
const KEY = 'me_bag_v1'
const MAX_QTY = 10

function read(): BagLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw
      .filter((l) => l && typeof l.variantId === 'string' && Number.isInteger(l.quantity) && l.quantity > 0)
      .map((l) => ({ variantId: l.variantId, quantity: Math.min(MAX_QTY, l.quantity) }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([])
  const [ready, setReady] = useState(false)
  const [isOpen, setOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLines(read())
    setReady(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setLines(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const commit = useCallback((update: (prev: BagLine[]) => BagLine[]) => {
    setLines((prev) => {
      const next = update(prev)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable (private mode) — the bag still works for this page view */
      }
      return next
    })
  }, [])

  const toast = useCallback((message: string) => {
    setToastMsg(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 3200)
  }, [])

  const value = useMemo<BagContext>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      add: (variantId, quantity) =>
        commit((prev) => {
          const existing = prev.find((l) => l.variantId === variantId)
          if (existing) return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l))
          return [...prev, { variantId, quantity: Math.min(MAX_QTY, quantity) }]
        }),
      setQuantity: (variantId, quantity) =>
        commit((prev) =>
          quantity < 1 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
        ),
      swap: (from, to) =>
        commit((prev) => {
          const current = prev.find((l) => l.variantId === from)
          if (!current || from === to) return prev
          const target = prev.find((l) => l.variantId === to)
          if (target) {
            return prev.filter((l) => l.variantId !== from).map((l) => (l.variantId === to ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + current.quantity) } : l))
          }
          return prev.map((l) => (l.variantId === from ? { ...l, variantId: to } : l))
        }),
      remove: (variantId) => commit((prev) => prev.filter((l) => l.variantId !== variantId)),
      clear: () => commit(() => []),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toast,
    }),
    [lines, ready, isOpen, commit, toast],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast" role="status" aria-live="polite" data-open={toastMsg ? 'true' : 'false'}>
        {toastMsg}
      </div>
    </Ctx.Provider>
  )
}

export function useBag(): BagContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBag must be used inside <CartProvider>')
  return ctx
}
