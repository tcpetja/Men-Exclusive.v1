'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { formatZAR } from '@/lib/money'
import { IconClose } from '../icons'
import { BagLines, usePricedBag } from './BagLines'
import { useBag } from './CartProvider'

export function CartDrawer() {
  const bag = useBag()
  const { cart, loading, failed } = usePricedBag(bag.lines, bag.isOpen)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!bag.isOpen) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && bag.close()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [bag.isOpen, bag])

  // The reduced quantities the server reports are written back so the bag and the server agree.
  useEffect(() => {
    if (!cart) return
    for (const line of cart.lines) {
      if (line.status === 'reduced') bag.setQuantity(line.variantId, line.quantity)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart])

  const empty = bag.ready && bag.lines.length === 0
  const canCheckout = cart && cart.itemCount > 0 && cart.lines.every((l) => l.status === 'ok' || l.status === 'reduced')

  return (
    <>
      <div className="scrim" data-open={bag.isOpen} onClick={bag.close} aria-hidden />
      <aside className="drawer drawer-right" data-open={bag.isOpen} role="dialog" aria-modal="true" aria-label="Shopping bag" inert={!bag.isOpen}>
        <div className="drawer-head">
          <h2 className="drawer-title">Your bag</h2>
          <button ref={closeRef} type="button" className="iconbtn" onClick={bag.close} aria-label="Close bag">
            <IconClose />
          </button>
        </div>
        <div className="drawer-body">
          {empty && (
            <div className="empty">
              <p className="soft">Your bag is empty.</p>
              <Link href="/shop" className="btn btn-line" onClick={bag.close}>
                Shop suits
              </Link>
            </div>
          )}
          {!empty && failed && <p className="notice notice-error mt">We could not load your bag. Check your connection and try again.</p>}
          {!empty && !cart && loading && <p className="muted mt">Loading your bag…</p>}
          {!empty && cart && <BagLines cart={cart} onNavigate={bag.close} />}
        </div>
        {!empty && cart && cart.lines.length > 0 && (
          <div className="drawer-foot">
            <div className="totals">
              <div className="totals-row totals-total" style={{ borderTop: 0, paddingTop: 0 }}>
                <span>Subtotal</span>
                <span>{formatZAR(cart.subtotalCents)}</span>
              </div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Delivery or collection is chosen at checkout.
              </p>
            </div>
            {canCheckout ? (
              <Link href="/checkout" className="btn btn-gold btn-block" onClick={bag.close}>
                Checkout securely
              </Link>
            ) : (
              <button type="button" className="btn btn-gold btn-block" disabled>
                Checkout securely
              </button>
            )}
            <Link href="/cart" className="btn btn-line btn-block" onClick={bag.close}>
              View bag
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
