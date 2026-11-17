'use server'

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { abandonOrder, createOrder, priceCart, quoteOrder, type PricedCart } from '@/lib/orders'
import { checkoutSchema, fieldErrors, type FieldErrors } from '@/lib/validation'
import { createCheckout, paymentsReady, YocoError } from '@/lib/yoco'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const PENDING_COOKIE = 'me_pending'

type LineInput = { variantId: string; quantity: number }

function cleanLines(input: unknown): LineInput[] {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, 50)
    .filter((l): l is LineInput => Boolean(l) && typeof l.variantId === 'string' && Number.isFinite(Number(l.quantity)))
    .map((l) => ({ variantId: l.variantId.slice(0, 40), quantity: Math.max(1, Math.min(10, Math.floor(Number(l.quantity)))) }))
}

/** Looks up live names, prices and stock for the bag stored in the browser. */
export async function priceCartAction(lines: unknown): Promise<PricedCart> {
  return priceCart(cleanLines(lines))
}

export type QuoteView = {
  cart: PricedCart
  options: { id: string; name: string; type: 'COLLECTION' | 'DELIVERY'; description: string; feeCents: number }[]
  selectedId: string | null
  promo: { ok: boolean; code?: string; message?: string } | null
  subtotalCents: number
  discountCents: number
  deliveryCents: number
  totalCents: number
}

export async function quoteAction(input: { lines: unknown; deliveryMethodId?: string | null; promoCode?: string | null }): Promise<QuoteView> {
  const q = await quoteOrder({
    lines: cleanLines(input?.lines),
    deliveryMethodId: typeof input?.deliveryMethodId === 'string' ? input.deliveryMethodId : null,
    promoCode: typeof input?.promoCode === 'string' ? input.promoCode.slice(0, 40) : null,
  })
  return {
    cart: q.cart,
    options: q.options,
    selectedId: q.selected?.id ?? null,
    promo: q.promo ? (q.promo.ok ? { ok: true, code: q.promo.code } : { ok: false, message: q.promo.message }) : null,
    subtotalCents: q.subtotalCents,
    discountCents: q.discountCents,
    deliveryCents: q.deliveryCents,
    totalCents: q.totalCents,
  }
}

export type PlaceOrderResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; message: string; fields?: FieldErrors; reviewBag?: boolean }

/**
 * Checkout: validates everything again on the server, holds the stock, creates a Yoco checkout and returns
 * the address of Yoco's secure payment page. The order stays "Pending payment" until Yoco's webhook confirms it.
 */
export async function placeOrderAction(raw: unknown): Promise<PlaceOrderResult> {
  if (!paymentsReady()) {
    return { ok: false, message: 'Online payment is not available yet. Please contact us on WhatsApp and we will help you complete your order.' }
  }
  if (!(await rateLimit(`checkout:${await clientIp()}`, 12, 600))) {
    return { ok: false, message: 'Too many attempts. Please wait a few minutes and try again.' }
  }

  const parsed = checkoutSchema.safeParse(raw)
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error)
    return { ok: false, message: fields.acceptTerms || fields.lines || 'Please check the highlighted fields.', fields }
  }
  const data = parsed.data
  const user = await getCurrentUser()
  const jar = await cookies()

  // If this browser abandoned an unpaid order (for example by pressing Back on the payment page),
  // release its stock first so the customer is not blocked by their own earlier attempt.
  const previous = jar.get(PENDING_COOKIE)?.value
  if (previous) {
    const stale = await db.order.findUnique({ where: { publicToken: previous }, select: { id: true, status: true } })
    if (stale?.status === 'PENDING_PAYMENT') await abandonOrder(stale.id, 'Replaced by a new checkout from the same customer. Stock released.')
  }

  const result = await createOrder({
    lines: data.lines,
    userId: user?.id ?? null,
    contact: { firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone },
    deliveryMethodId: data.deliveryMethodId,
    address: data.address,
    promoCode: data.promoCode || null,
    customerNote: data.customerNote,
    expectedTotalCents: data.expectedTotalCents,
  })
  if (!result.ok) {
    return { ok: false, message: result.message, reviewBag: result.code === 'changed' || result.code === 'stock' || result.code === 'empty' }
  }

  const { order } = result
  try {
    const checkout = await createCheckout(order)
    await db.order.update({
      where: { id: order.id },
      data: { yocoCheckoutId: checkout.id, yocoRedirectUrl: checkout.redirectUrl, yocoMode: checkout.processingMode },
    })
    jar.set(PENDING_COOKIE, order.publicToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 6 })
    return { ok: true, redirectUrl: checkout.redirectUrl }
  } catch (err) {
    console.error('[checkout] could not create Yoco checkout', err instanceof YocoError ? { message: err.message, status: err.status } : err)
    await abandonOrder(order.id, 'The payment page could not be opened. Nothing was charged. Order cancelled and stock released.')
    return { ok: false, message: 'We could not open the secure payment page. Nothing has been charged. Please try again in a moment.' }
  }
}

/** Polled by the order page while it waits for Yoco's confirmation. */
export async function orderStatusAction(token: unknown): Promise<{ status: string } | null> {
  if (typeof token !== 'string' || token.length > 80) return null
  const order = await db.order.findUnique({ where: { publicToken: token }, select: { status: true } })
  return order ? { status: order.status } : null
}

/** Lets a customer cancel their own unpaid order (and free the stock) from the order page. */
export async function cancelPendingOrderAction(token: unknown): Promise<{ ok: boolean }> {
  if (typeof token !== 'string' || token.length > 80) return { ok: false }
  const order = await db.order.findUnique({ where: { publicToken: token }, select: { id: true, status: true } })
  if (!order || order.status !== 'PENDING_PAYMENT') return { ok: false }
  await abandonOrder(order.id, 'Cancelled by the customer before payment. Stock released.')
  return { ok: true }
}
