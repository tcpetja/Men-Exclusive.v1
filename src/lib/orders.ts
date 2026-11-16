import { db, type Tx } from './db'
import { getSettings } from './settings'
import { newToken } from './password'
import { YOCO_MIN_CENTS, yocoConfig, type YocoEvent } from './yoco'
import { sendOrderConfirmation, sendOrderStatusEmail, sendPaymentAlert, sendStoreOrderNotification } from './email'
import { allowedTransitions, orderStatusLabel, REFUNDABLE_STATUSES } from './constants'
import type { OrderStatus } from '@/generated/prisma/enums'

// ───────────────────────── Cart pricing ─────────────────────────

export type CartLineInput = { variantId: string; quantity: number }

export type LineStatus = 'ok' | 'reduced' | 'sold_out' | 'on_request' | 'gone'

export type PricedLine = {
  variantId: string
  /** Quantity that can actually be bought right now (may be lower than requested). */
  quantity: number
  requested: number
  status: LineStatus
  productId: string
  slug: string
  name: string
  sku: string
  colour: string
  size: string
  unitCents: number
  lineCents: number
  stock: number
  image: string | null
  /** Other colour/size combinations of the same product, so the customer can switch in the bag. */
  options: { colour: string; sizes: { variantId: string; size: string; stock: number }[] }[]
}

export type PricedCart = {
  lines: PricedLine[]
  subtotalCents: number
  itemCount: number
  /** True when every line can be bought exactly as requested. */
  clean: boolean
}

export const MAX_LINE_QTY = 10

export async function priceCart(input: CartLineInput[]): Promise<PricedCart> {
  // Merge duplicates and drop nonsense before touching the database.
  const wanted = new Map<string, number>()
  for (const l of input.slice(0, 50)) {
    if (!l || typeof l.variantId !== 'string') continue
    const q = Math.floor(Number(l.quantity))
    if (!Number.isFinite(q) || q < 1) continue
    wanted.set(l.variantId, Math.min(MAX_LINE_QTY, (wanted.get(l.variantId) ?? 0) + q))
  }
  if (wanted.size === 0) return { lines: [], subtotalCents: 0, itemCount: 0, clean: true }

  await maybeExpireStaleOrders()

  const variants = await db.variant.findMany({
    where: { id: { in: [...wanted.keys()] } },
    include: {
      colour: {
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' } },
              colours: { orderBy: { sortOrder: 'asc' }, include: { variants: { orderBy: { sortOrder: 'asc' } } } },
            },
          },
        },
      },
    },
  })
  const byId = new Map(variants.map((v) => [v.id, v]))

  const lines: PricedLine[] = []
  for (const [variantId, requested] of wanted) {
    const v = byId.get(variantId)
    if (!v || !v.colour.product.isActive) {
      lines.push({
        variantId, quantity: 0, requested, status: 'gone', productId: '', slug: '', name: 'This item is no longer available',
        sku: '', colour: '', size: '', unitCents: 0, lineCents: 0, stock: 0, image: null, options: [],
      })
      continue
    }
    const product = v.colour.product
    const image = product.images.find((i) => i.colourId === v.colourId) ?? product.images[0] ?? null
    const unitCents = product.priceCents ?? 0
    let status: LineStatus = 'ok'
    let quantity = requested
    if (product.priceCents == null) {
      status = 'on_request'
      quantity = 0
    } else if (v.stock <= 0) {
      status = 'sold_out'
      quantity = 0
    } else if (requested > v.stock) {
      status = 'reduced'
      quantity = v.stock
    }
    lines.push({
      variantId,
      quantity,
      requested,
      status,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: v.sku || product.sku,
      colour: v.colour.name,
      size: v.size,
      unitCents,
      lineCents: unitCents * quantity,
      stock: v.stock,
      image: image?.url ?? null,
      options: product.colours.map((c) => ({
        colour: c.name,
        sizes: c.variants.map((x) => ({ variantId: x.id, size: x.size, stock: x.stock })),
      })),
    })
  }
  return {
    lines,
    subtotalCents: lines.reduce((sum, l) => sum + l.lineCents, 0),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    clean: lines.every((l) => l.status === 'ok'),
  }
}

// ───────────────────────── Quote (totals) ─────────────────────────

export type DeliveryOption = {
  id: string
  name: string
  type: 'COLLECTION' | 'DELIVERY'
  description: string
  feeCents: number
}

export async function deliveryOptions(subtotalAfterDiscountCents: number): Promise<DeliveryOption[]> {
  const methods = await db.deliveryMethod.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  return methods.map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    description: m.description,
    feeCents: m.freeOverCents != null && subtotalAfterDiscountCents >= m.freeOverCents ? 0 : m.feeCents,
  }))
}

export type PromoResult = { ok: true; code: string; discountCents: number } | { ok: false; message: string }

export async function evaluatePromo(rawCode: string, subtotalCents: number): Promise<PromoResult> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { ok: false, message: 'Enter a promo code.' }
  const promo = await db.promoCode.findUnique({ where: { code } })
  const now = new Date()
  if (!promo || !promo.isActive) return { ok: false, message: 'That promo code is not valid.' }
  if (promo.startsAt && promo.startsAt > now) return { ok: false, message: 'That promo code is not active yet.' }
  if (promo.endsAt && promo.endsAt < now) return { ok: false, message: 'That promo code has expired.' }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return { ok: false, message: 'That promo code has been fully redeemed.' }
  if (subtotalCents < promo.minSpendCents) {
    return { ok: false, message: `That code applies to orders of R ${(promo.minSpendCents / 100).toFixed(0)} or more.` }
  }
  const discountCents =
    promo.type === 'PERCENT' ? Math.round((subtotalCents * Math.min(100, promo.value)) / 100) : Math.min(promo.value, subtotalCents)
  return { ok: true, code, discountCents }
}

export type Quote = {
  cart: PricedCart
  options: DeliveryOption[]
  selected: DeliveryOption | null
  promo: PromoResult | null
  subtotalCents: number
  discountCents: number
  deliveryCents: number
  totalCents: number
}

export async function quoteOrder(input: { lines: CartLineInput[]; deliveryMethodId?: string | null; promoCode?: string | null }): Promise<Quote> {
  const cart = await priceCart(input.lines)
  const promo = input.promoCode ? await evaluatePromo(input.promoCode, cart.subtotalCents) : null
  const discountCents = promo?.ok ? promo.discountCents : 0
  const options = await deliveryOptions(cart.subtotalCents - discountCents)
  const selected = options.find((o) => o.id === input.deliveryMethodId) ?? null
  const deliveryCents = selected?.feeCents ?? 0
  return {
    cart,
    options,
    selected,
    promo,
    subtotalCents: cart.subtotalCents,
    discountCents,
    deliveryCents,
    totalCents: cart.subtotalCents - discountCents + deliveryCents,
  }
}

// ───────────────────────── Order creation ─────────────────────────

export type NewOrderInput = {
  lines: CartLineInput[]
  userId: string | null
  contact: { firstName: string; lastName: string; email: string; phone: string }
  deliveryMethodId: string
  address: { line1: string; line2?: string; suburb: string; city: string; province: string; postalCode: string } | null
  promoCode: string | null
  customerNote: string
  /** The total the customer saw on screen. The order is refused if the server's total differs. */
  expectedTotalCents: number
}

export type CreateOrderResult =
  | { ok: true; order: { id: string; number: string; publicToken: string; totalCents: number } }
  | { ok: false; code: 'empty' | 'changed' | 'delivery' | 'stock' | 'minimum'; message: string }

class StockError extends Error {}

/**
 * Creates a pending order and holds its stock inside one database transaction.
 * Stock is decremented with a conditional update, so two customers can never buy the last suit in a size.
 */
export async function createOrder(input: NewOrderInput): Promise<CreateOrderResult> {
  await expireStaleOrders()
  const quote = await quoteOrder({ lines: input.lines, deliveryMethodId: input.deliveryMethodId, promoCode: input.promoCode })
  const { cart } = quote

  if (cart.lines.length === 0 || cart.itemCount === 0) return { ok: false, code: 'empty', message: 'Your bag is empty.' }
  if (!cart.clean) {
    return { ok: false, code: 'changed', message: 'Some items in your bag are no longer available in the quantity you chose. Please review your bag.' }
  }
  if (input.promoCode && quote.promo && !quote.promo.ok) return { ok: false, code: 'changed', message: quote.promo.message }
  if (!quote.selected) return { ok: false, code: 'delivery', message: 'Choose how you would like to receive your order.' }
  if (quote.selected.type === 'DELIVERY' && !input.address) {
    return { ok: false, code: 'delivery', message: 'Enter the address you would like your order delivered to.' }
  }
  if (quote.totalCents !== input.expectedTotalCents) {
    return { ok: false, code: 'changed', message: 'The total for your order has changed. Please review the updated amount before paying.' }
  }
  if (quote.totalCents < YOCO_MIN_CENTS) return { ok: false, code: 'minimum', message: 'Orders under R 2 cannot be paid online.' }

  const method = quote.selected
  const address = method.type === 'DELIVERY' ? input.address : null
  const publicToken = newToken(24)

  try {
    const order = await db.$transaction(async (tx) => {
      for (const line of cart.lines) {
        const res = await tx.variant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
        if (res.count !== 1) throw new StockError(line.name)
      }
      const created = await tx.order.create({
        data: {
          number: `tmp-${publicToken}`,
          publicToken,
          userId: input.userId,
          email: input.contact.email.toLowerCase(),
          firstName: input.contact.firstName,
          lastName: input.contact.lastName,
          phone: input.contact.phone,
          fulfilmentType: method.type,
          deliveryMethodName: method.name,
          deliveryNote: method.description,
          shipLine1: address?.line1,
          shipLine2: address?.line2 || null,
          shipSuburb: address?.suburb,
          shipCity: address?.city,
          shipProvince: address?.province,
          shipPostalCode: address?.postalCode,
          subtotalCents: quote.subtotalCents,
          discountCents: quote.discountCents,
          deliveryCents: quote.deliveryCents,
          totalCents: quote.totalCents,
          promoCode: quote.promo?.ok ? quote.promo.code : null,
          customerNote: input.customerNote,
          stockHeld: true,
          items: {
            create: cart.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.name,
              sku: l.sku,
              colour: l.colour,
              size: l.size,
              unitCents: l.unitCents,
              quantity: l.quantity,
              imageUrl: l.image,
              slug: l.slug,
            })),
          },
          events: { create: { kind: 'created', message: 'Order placed. Waiting for payment.', actor: 'customer' } },
        },
      })
      return tx.order.update({ where: { id: created.id }, data: { number: `ME-${10000 + created.seq}` } })
    })
    return { ok: true, order: { id: order.id, number: order.number, publicToken: order.publicToken, totalCents: order.totalCents } }
  } catch (err) {
    if (err instanceof StockError) {
      return { ok: false, code: 'stock', message: `Someone has just bought the last ${err.message} in that size. Please review your bag.` }
    }
    throw err
  }
}

// ───────────────────────── Stock holds ─────────────────────────

async function releaseStock(tx: Tx, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } })
  for (const item of items) {
    if (!item.variantId) continue
    await tx.variant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
  }
}

/** Cancels unpaid orders whose hold has run out and returns their stock to the shelf. */
export async function expireStaleOrders(): Promise<number> {
  const { reservationMinutes } = await getSettings()
  const cutoff = new Date(Date.now() - Math.max(10, reservationMinutes) * 60_000)
  const stale = await db.order.findMany({ where: { status: 'PENDING_PAYMENT', createdAt: { lt: cutoff } }, select: { id: true } })
  let expired = 0
  for (const { id } of stale) {
    await db.$transaction(async (tx) => {
      const res = await tx.order.updateMany({ where: { id, status: 'PENDING_PAYMENT' }, data: { status: 'CANCELLED', stockHeld: false } })
      if (res.count !== 1) return
      await releaseStock(tx, id)
      await tx.orderEvent.create({
        data: { orderId: id, kind: 'status', message: `Payment was not completed within ${reservationMinutes} minutes. Order cancelled and stock released.` },
      })
      expired++
    })
  }
  return expired
}

let lastExpiryRun = 0
/** Same as expireStaleOrders, but at most once a minute per server instance — cheap enough to call while browsing. */
export async function maybeExpireStaleOrders() {
  if (Date.now() - lastExpiryRun < 60_000) return
  lastExpiryRun = Date.now()
  try {
    await expireStaleOrders()
  } catch (err) {
    console.error('[orders] expiry sweep failed', err)
  }
}

/** Used when the payment page could not be opened at all: nothing was charged, so undo the order. */
export async function abandonOrder(orderId: string, reason: string) {
  await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({ where: { id: orderId, status: 'PENDING_PAYMENT' }, data: { status: 'CANCELLED', stockHeld: false } })
    if (res.count !== 1) return
    await releaseStock(tx, orderId)
    await tx.orderEvent.create({ data: { orderId, kind: 'status', message: reason } })
  })
}

// ───────────────────────── Payment events (from the verified webhook) ─────────────────────────

async function loadOrderForEmail(id: string) {
  return db.order.findUnique({ where: { id }, include: { items: true } })
}

async function flag(orderId: string, orderNumber: string, problem: string) {
  await db.order.update({ where: { id: orderId }, data: { needsAttention: problem, events: { create: { kind: 'payment_issue', message: problem } } } })
  await sendPaymentAlert(orderNumber, problem)
}

async function findOrderForEvent(event: YocoEvent) {
  const meta = event.payload.metadata ?? {}
  if (typeof meta.checkoutId === 'string') {
    const byCheckout = await db.order.findUnique({ where: { yocoCheckoutId: meta.checkoutId }, include: { items: true } })
    if (byCheckout) return byCheckout
  }
  if (typeof meta.orderId === 'string') {
    return db.order.findUnique({ where: { id: meta.orderId }, include: { items: true } })
  }
  return null
}

export type EventOutcome = { result: string; notify?: () => Promise<void> }

export async function handlePaymentSucceeded(event: YocoEvent): Promise<EventOutcome> {
  const p = event.payload
  const order = await findOrderForEvent(event)
  if (!order) return { result: 'ignored: no matching order' }

  const mode = yocoConfig().mode
  if (p.mode !== mode) return { result: `ignored: ${p.mode} event received while the site is in ${mode} mode` }
  if (order.yocoMode && order.yocoMode !== p.mode) return { result: 'ignored: payment mode does not match the order' }

  if (p.currency !== 'ZAR' || p.amount !== order.totalCents) {
    await flag(
      order.id,
      order.number,
      `Yoco reported a payment of ${p.currency} ${(p.amount / 100).toFixed(2)} but the order total is ZAR ${(order.totalCents / 100).toFixed(2)}. The order was NOT marked as paid. Check the payment in your Yoco account.`,
    )
    return { result: 'flagged: amount mismatch' }
  }

  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'CANCELLED') {
    if (order.yocoPaymentId && order.yocoPaymentId !== p.id) {
      await flag(order.id, order.number, `A second payment (${p.id}) was received for this order, which was already paid. Check your Yoco account and refund the duplicate if needed.`)
      return { result: 'flagged: duplicate payment' }
    }
    return { result: 'ok: already paid' }
  }

  const shortages: string[] = []
  const changed = await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: 'PAID', paidAt: new Date(), yocoPaymentId: p.id, yocoMode: p.mode },
    })
    if (res.count !== 1) return false

    if (!order.stockHeld) {
      // The hold had already been released (order expired or was cancelled) — try to take the stock again.
      for (const item of order.items) {
        if (!item.variantId) continue
        const r = await tx.variant.updateMany({ where: { id: item.variantId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
        if (r.count !== 1) shortages.push(`${item.name} (${item.colour}, size ${item.size})`)
      }
      await tx.order.update({ where: { id: order.id }, data: { stockHeld: true } })
    }
    if (order.promoCode) {
      await tx.promoCode.updateMany({ where: { code: order.promoCode }, data: { usedCount: { increment: 1 } } })
    }
    const card = p.paymentMethodDetails?.card
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        kind: 'paid',
        message: `Payment of ZAR ${(p.amount / 100).toFixed(2)} confirmed by Yoco${card?.scheme ? ` (${card.scheme}${card.maskedCard ? ' ' + card.maskedCard : ''})` : ''}. Payment ID ${p.id}.`,
      },
    })
    return true
  })
  if (!changed) return { result: 'ok: already processed' }

  if (shortages.length > 0) {
    await flag(
      order.id,
      order.number,
      `Payment arrived after this order's stock hold had ended, and these items are no longer in stock: ${shortages.join('; ')}. Contact the customer to arrange an alternative or refund the order.`,
    )
  }

  return {
    result: 'ok: order marked as paid',
    notify: async () => {
      const fresh = await loadOrderForEmail(order.id)
      if (!fresh) return
      await sendOrderConfirmation(fresh)
      await sendStoreOrderNotification(fresh)
    },
  }
}

export async function handleRefundEvent(event: YocoEvent): Promise<EventOutcome> {
  const p = event.payload
  const order = await findOrderForEvent(event)
  if (!order) return { result: 'ignored: no matching order' }
  if (p.mode !== yocoConfig().mode) return { result: 'ignored: mode mismatch' }

  if (event.type === 'refund.failed') {
    await flag(order.id, order.number, `Yoco could not complete a refund of ZAR ${(p.amount / 100).toFixed(2)} for this order. Check your Yoco account.`)
    return { result: 'flagged: refund failed' }
  }

  const refundedCents =
    typeof p.refundableAmount === 'number' ? Math.max(0, order.totalCents - p.refundableAmount) : Math.min(order.totalCents, order.refundedCents + p.amount)
  const full = refundedCents >= order.totalCents
  const applied = await applyRefund(order.id, refundedCents, full, `Yoco confirmed a refund of ZAR ${(p.amount / 100).toFixed(2)}.`, 'system')
  return {
    result: full ? 'ok: order refunded' : 'ok: partial refund recorded',
    notify: applied && full ? () => notifyStatus(order.id) : undefined,
  }
}

/** Records a refund. A full refund moves the order to Refunded and, if it never left the store, returns the items to stock. */
export async function applyRefund(orderId: string, refundedCents: number, full: boolean, message: string, actor: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (!order || order.status === 'REFUNDED') return false
    if (!full) {
      await tx.order.update({ where: { id: orderId }, data: { refundedCents, events: { create: { kind: 'refund', message, actor } } } })
      return true
    }
    const neverLeft = order.status === 'PAID' || order.status === 'PROCESSING' || order.status === 'READY_FOR_COLLECTION'
    const restock = neverLeft && order.stockHeld
    if (restock) await releaseStock(tx, orderId)
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'REFUNDED',
        refundedCents,
        stockHeld: restock ? false : order.stockHeld,
        events: {
          create: {
            kind: 'refund',
            actor,
            message: message + (restock ? ' Items returned to stock.' : ' Stock was not changed — adjust it in Products if the items come back.'),
          },
        },
      },
    })
    return true
  })
}

// ───────────────────────── Status changes (admin) ─────────────────────────

export async function notifyStatus(orderId: string) {
  const fresh = await loadOrderForEmail(orderId)
  if (fresh) await sendOrderStatusEmail(fresh)
}

export type StatusChange = { ok: true } | { ok: false; message: string }

export async function changeOrderStatus(
  orderId: string,
  to: OrderStatus,
  actor: string,
  extra: { trackingNumber?: string; trackingUrl?: string; note?: string } = {},
): Promise<StatusChange> {
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { ok: false, message: 'Order not found.' }
  if (!allowedTransitions(order.status, order.fulfilmentType).includes(to)) {
    return { ok: false, message: `An order that is "${orderStatusLabel(order.status, order.fulfilmentType)}" cannot be moved to "${orderStatusLabel(to, order.fulfilmentType)}".` }
  }
  await db.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: {
        status: to,
        trackingNumber: extra.trackingNumber || order.trackingNumber,
        trackingUrl: extra.trackingUrl || order.trackingUrl,
        stockHeld: to === 'CANCELLED' ? false : order.stockHeld,
      },
    })
    if (res.count !== 1) throw new Error('The order changed while you were editing it. Reload and try again.')
    if (to === 'CANCELLED' && order.stockHeld) await releaseStock(tx, orderId)
    await tx.orderEvent.create({
      data: {
        orderId,
        kind: 'status',
        actor,
        message: `Status changed to ${orderStatusLabel(to, order.fulfilmentType)}.${extra.note ? ' ' + extra.note : ''}`,
      },
    })
  })
  await notifyStatus(orderId)
  return { ok: true }
}

export function canRefund(status: OrderStatus): boolean {
  return REFUNDABLE_STATUSES.includes(status)
}
