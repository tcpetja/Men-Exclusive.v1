'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cancelPendingOrderAction, orderStatusAction } from '@/app/actions/shop'
import { useBag } from '../cart/CartProvider'

/**
 * Shown on the order page while an order is still "Pending payment".
 *
 * Coming back from Yoco is not proof of payment, so this waits for the server (which only marks the order
 * paid after Yoco's signed webhook) and refreshes the page as soon as that happens.
 */
export function PaymentWatcher({ token, returned, payUrl }: { token: string; returned: 'success' | 'cancelled' | 'failed' | null; payUrl: string | null }) {
  const router = useRouter()
  const bag = useBag()
  const [waitedTooLong, setWaitedTooLong] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const tries = useRef(0)

  useEffect(() => {
    if (returned !== 'success') return
    let stop = false
    const tick = async () => {
      if (stop) return
      tries.current++
      const res = await orderStatusAction(token).catch(() => null)
      if (stop) return
      if (res && res.status !== 'PENDING_PAYMENT') {
        if (res.status === 'PAID') bag.clear()
        router.replace(`/order/${token}`)
        router.refresh()
        return
      }
      if (tries.current >= 40) {
        setWaitedTooLong(true)
        return
      }
      setTimeout(tick, tries.current < 10 ? 2000 : 4000)
    }
    const first = setTimeout(tick, 1200)
    return () => {
      stop = true
      clearTimeout(first)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returned, token])

  const cancel = async () => {
    setCancelling(true)
    await cancelPendingOrderAction(token).catch(() => null)
    router.replace(`/order/${token}`)
    router.refresh()
  }

  if (returned === 'success' && !waitedTooLong) {
    return (
      <div className="notice" role="status" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span className="spinner spinner-gold" aria-hidden />
        <span>
          <strong>Confirming your payment with Yoco.</strong> This usually takes a few seconds. Please keep this page open.
        </span>
      </div>
    )
  }

  return (
    <div className="notice stack" role="status">
      <p>
        {returned === 'success' ? (
          <>
            <strong>We are still waiting for confirmation from Yoco.</strong> If your payment went through, we will email your order confirmation as soon as it is confirmed. You do not need to pay again.
          </>
        ) : returned === 'failed' ? (
          <>
            <strong>Your payment did not go through.</strong> Nothing has been charged. You can try again, or cancel the order.
          </>
        ) : returned === 'cancelled' ? (
          <>
            <strong>Payment was not completed.</strong> Your items are still being held for you. You can return to the payment page, or cancel the order.
          </>
        ) : (
          <>
            <strong>This order has not been paid yet.</strong> Your items are held for a limited time while you complete payment.
          </>
        )}
      </p>
      {returned !== 'success' && (
        <div className="actions">
          {payUrl && (
            <a href={payUrl} className="btn btn-gold btn-sm">
              Complete payment
            </a>
          )}
          <button type="button" className="btn btn-line btn-sm" onClick={cancel} disabled={cancelling}>
            {cancelling ? 'Cancelling…' : 'Cancel this order'}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Rendered when the customer lands back from Yoco and the order is already confirmed as paid:
 * empties the bag and removes the "?payment=" marker from the address so a reload does nothing.
 */
export function ClearBagOnPaid({ token }: { token: string }) {
  const bag = useBag()
  const router = useRouter()
  useEffect(() => {
    if (!bag.ready) return
    bag.clear()
    router.replace(`/order/${token}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bag.ready])
  return null
}
