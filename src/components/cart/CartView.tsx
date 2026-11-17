'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { formatZAR } from '@/lib/money'
import { IconLock, IconWhatsApp } from '../icons'
import { BagLines, usePricedBag } from './BagLines'
import { useBag } from './CartProvider'

export function CartView({ whatsappHref }: { whatsappHref: string | null }) {
  const bag = useBag()
  const { cart, loading, failed } = usePricedBag(bag.lines, bag.ready)

  useEffect(() => {
    if (!cart) return
    for (const line of cart.lines) if (line.status === 'reduced') bag.setQuantity(line.variantId, line.quantity)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart])

  if (!bag.ready) return <p className="muted">Loading your bag…</p>

  if (bag.lines.length === 0) {
    return (
      <div className="empty">
        <h2 className="display-sm">Your bag is empty</h2>
        <p className="soft">Find a suit you like and add it here. Your bag is saved on this device.</p>
        <div className="actions">
          <Link href="/shop" className="btn btn-gold">
            Shop suits
          </Link>
          <Link href="/occasions" className="btn btn-line">
            Shop by occasion
          </Link>
        </div>
      </div>
    )
  }

  const blocked = cart ? cart.lines.some((l) => l.status === 'sold_out' || l.status === 'on_request' || l.status === 'gone') : false
  const canCheckout = Boolean(cart && cart.itemCount > 0 && !blocked)

  return (
    <div className="checkout">
      <div>
        {failed && <p className="notice notice-error">We could not load your bag. Check your connection and reload the page.</p>}
        {!cart && loading && <p className="muted">Checking prices and stock…</p>}
        {cart && <BagLines cart={cart} />}
      </div>
      <aside className="panel checkout-summary stack">
        <h2 className="step-title">Summary</h2>
        <div className="totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{cart ? formatZAR(cart.subtotalCents) : '…'}</span>
          </div>
          <div className="totals-row">
            <span>Delivery or collection</span>
            <span>Chosen at checkout</span>
          </div>
          <div className="totals-row totals-total">
            <span>Total so far</span>
            <span>{cart ? formatZAR(cart.subtotalCents) : '…'}</span>
          </div>
        </div>
        {blocked && <p className="notice notice-error">Remove or change the unavailable items to continue.</p>}
        {canCheckout ? (
          <Link href="/checkout" className="btn btn-gold btn-block">
            <IconLock />
            Checkout securely
          </Link>
        ) : (
          <button type="button" className="btn btn-gold btn-block" disabled>
            Checkout securely
          </button>
        )}
        <Link href="/shop" className="btn btn-line btn-block">
          Continue shopping
        </Link>
        <p className="muted" style={{ fontSize: '0.82rem' }}>
          Prices are in South African Rand. You can check out as a guest or sign in. Payment is processed securely by Yoco.
        </p>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="link" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: '0.88rem' }}>
            <IconWhatsApp width={18} height={18} />
            Need help with sizes before you pay?
          </a>
        )}
      </aside>
    </div>
  )
}
