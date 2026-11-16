'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { priceCartAction } from '@/app/actions/shop'
import type { PricedCart, PricedLine } from '@/lib/orders'
import { formatZAR } from '@/lib/money'
import { useBag, type BagLine } from './CartProvider'

/** Fetches live prices and stock for the bag whenever it changes. */
export function usePricedBag(lines: BagLine[], enabled = true) {
  const [cart, setCart] = useState<PricedCart | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const seq = useRef(0)
  const key = JSON.stringify(lines)

  useEffect(() => {
    if (!enabled) return
    if (lines.length === 0) {
      setCart({ lines: [], subtotalCents: 0, itemCount: 0, clean: true })
      return
    }
    const mine = ++seq.current
    setLoading(true)
    setFailed(false)
    priceCartAction(lines)
      .then((result) => {
        if (mine === seq.current) setCart(result)
      })
      .catch(() => {
        if (mine === seq.current) setFailed(true)
      })
      .finally(() => {
        if (mine === seq.current) setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  return { cart, loading, failed }
}

const STATUS_NOTE: Record<PricedLine['status'], string | null> = {
  ok: null,
  reduced: 'Only this many are left, so we have adjusted the quantity.',
  sold_out: 'This size has sold out. Choose another size or remove it.',
  on_request: 'This item is not available to buy online yet. Please enquire on WhatsApp.',
  gone: 'This item is no longer available.',
}

export function BagLines({ cart, onNavigate }: { cart: PricedCart; onNavigate?: () => void }) {
  const bag = useBag()
  return (
    <ul>
      {cart.lines.map((line) => {
        const note = STATUS_NOTE[line.status]
        const choices = line.options.flatMap((o) =>
          o.sizes.filter((s) => s.stock > 0 || s.variantId === line.variantId).map((s) => ({ id: s.variantId, label: `${o.colour}, size ${s.size}` })),
        )
        return (
          <li key={line.variantId} className="line">
            <div className="line-media">
              {line.image && <Image src={line.image} alt="" fill sizes="84px" />}
            </div>
            <div className="line-body">
              <div className="line-top">
                {line.slug ? (
                  <Link href={`/shop/${line.slug}`} onClick={onNavigate}>
                    {line.name}
                  </Link>
                ) : (
                  <span>{line.name}</span>
                )}
                {line.unitCents > 0 && line.quantity > 0 && <span className="price">{formatZAR(line.lineCents)}</span>}
              </div>
              {line.sku && <div className="line-meta">Ref {line.sku}</div>}
              {note && <div className="error">{note}</div>}
              <div className="line-controls">
                {choices.length > 1 ? (
                  <select
                    className="select"
                    aria-label={`Colour and size for ${line.name}`}
                    value={line.variantId}
                    onChange={(e) => bag.swap(line.variantId, e.target.value)}
                  >
                    {choices.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  line.colour && (
                    <span className="line-meta">
                      {line.colour}, size {line.size}
                    </span>
                  )
                )}
                {line.status === 'ok' || line.status === 'reduced' ? (
                  <div className="qty qty-sm" role="group" aria-label={`Quantity for ${line.name}`}>
                    <button type="button" aria-label="Decrease quantity" onClick={() => bag.setQuantity(line.variantId, line.quantity - 1)}>
                      −
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={line.quantity >= Math.min(line.stock, 10)}
                      onClick={() => bag.setQuantity(line.variantId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                ) : null}
                <button type="button" className="remove" onClick={() => bag.remove(line.variantId)}>
                  Remove
                </button>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
