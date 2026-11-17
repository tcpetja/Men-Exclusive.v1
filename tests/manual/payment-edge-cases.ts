/**
 * Manual integration check for the payment edge cases. Needs a running site (SITE_URL), a database and
 * test-mode Yoco settings. It creates and then removes its own test product and orders.
 *
 *   npx tsx tests/manual/payment-edge-cases.ts
 */
import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { db } from '../../src/lib/db'
import { createOrder, abandonOrder } from '../../src/lib/orders'
import { signWebhook } from '../../src/lib/yoco'

const SITE = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const SECRET = process.env.YOCO_TEST_WEBHOOK_SECRET!
const rid = (p: string) => `${p}_${randomBytes(8).toString('hex')}`

async function deliver(event: object, opts: { webhookId?: string; tamper?: boolean; ageSeconds?: number } = {}) {
  const raw = JSON.stringify(event)
  const id = opts.webhookId ?? rid('msg')
  const ts = String(Math.floor(Date.now() / 1000) - (opts.ageSeconds ?? 0))
  const signature = signWebhook(id, ts, raw, SECRET)
  const res = await fetch(`${SITE}/api/webhooks/yoco`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': signature },
    body: opts.tamper ? raw.replace('"ZAR"', '"ZAR" ') : raw,
  })
  return { status: res.status, body: await res.json().catch(() => ({})) }
}

const paymentEvent = (checkoutId: string, amount: number, mode = 'test') => ({
  id: rid('evt'),
  type: 'payment.succeeded',
  createdDate: new Date().toISOString(),
  payload: { id: rid('p'), type: 'payment', amount, currency: 'ZAR', mode, status: 'succeeded', metadata: { checkoutId } },
})

async function main() {
  assert.ok(SECRET, 'YOCO_TEST_WEBHOOK_SECRET must be set')
  const method = await db.deliveryMethod.findFirst({ where: { isActive: true, type: 'COLLECTION' } })
  assert.ok(method, 'an active collection option is needed')

  const product = await db.product.create({
    data: {
      slug: rid('edge-test'), sku: rid('EDGE'), name: 'Edge case test suit', priceCents: 250000, isActive: true,
      colours: { create: { name: 'Test', variants: { create: { size: 'T1', stock: 1 } } } },
    },
    include: { colours: { include: { variants: true } } },
  })
  const variantId = product.colours[0].variants[0].id
  const stock = async () => (await db.variant.findUnique({ where: { id: variantId } }))!.stock
  const order = async (email: string) =>
    createOrder({
      lines: [{ variantId, quantity: 1 }], userId: null, contact: { firstName: 'Edge', lastName: 'Case', email, phone: '0820000000' },
      deliveryMethodId: method!.id, address: null, promoCode: null, customerNote: '', expectedTotalCents: 250000,
    })
  const withCheckout = async (id: string) => {
    const checkoutId = rid('ch_test')
    await db.order.update({ where: { id }, data: { yocoCheckoutId: checkoutId, yocoMode: 'test' } })
    return checkoutId
  }
  const created: string[] = []
  let passed = 0
  const ok = (name: string) => {
    console.log(`  ok  ${name}`)
    passed++
  }

  try {
    // 1. Two customers race for the last suit: exactly one order is created.
    const [a, b] = await Promise.all([order('race-a@example.com'), order('race-b@example.com')])
    const winners = [a, b].filter((r) => r.ok)
    assert.equal(winners.length, 1, 'exactly one of two simultaneous orders may succeed')
    assert.equal([a, b].find((r) => !r.ok)!.ok, false)
    assert.equal(await stock(), 0)
    const first = (winners[0] as Extract<typeof a, { ok: true }>).order
    created.push(first.id)
    ok('two simultaneous orders for the last unit: one succeeds, one is told it sold out')

    // 2. A changed total is refused (customer always sees the amount they will pay).
    await abandonOrder(first.id, 'test reset')
    assert.equal(await stock(), 1, 'cancelling an unpaid order returns its stock')
    const wrongTotal = await createOrder({
      lines: [{ variantId, quantity: 1 }], userId: null, contact: { firstName: 'Edge', lastName: 'Case', email: 'x@example.com', phone: '0820000000' },
      deliveryMethodId: method!.id, address: null, promoCode: null, customerNote: '', expectedTotalCents: 100,
    })
    assert.equal(wrongTotal.ok, false)
    assert.equal(await stock(), 1)
    ok('an order whose total differs from what the customer saw is refused and holds no stock')

    // 3. Tampered, stale and unsigned deliveries are rejected.
    const o3 = await order('sig@example.com'); assert.ok(o3.ok); created.push(o3.order.id)
    const ch3 = await withCheckout(o3.order.id)
    assert.equal((await deliver(paymentEvent(ch3, 250000), { tamper: true })).status, 403)
    assert.equal((await deliver(paymentEvent(ch3, 250000), { ageSeconds: 900 })).status, 403)
    assert.equal((await fetch(`${SITE}/api/webhooks/yoco`, { method: 'POST', body: JSON.stringify(paymentEvent(ch3, 250000)) })).status, 403)
    assert.equal((await db.order.findUnique({ where: { id: o3.order.id } }))!.status, 'PENDING_PAYMENT')
    ok('tampered, stale and unsigned webhooks are rejected and the order stays unpaid')

    // 4. Wrong amount: flagged for the owner, never marked paid.
    assert.equal((await deliver(paymentEvent(ch3, 100))).status, 200)
    let row = (await db.order.findUnique({ where: { id: o3.order.id } }))!
    assert.equal(row.status, 'PENDING_PAYMENT')
    assert.ok(row.needsAttention?.includes('NOT marked as paid'))
    ok('a payment for the wrong amount is flagged and the order is not marked paid')

    // 5. A live-mode event cannot pay an order while the site is in test mode.
    assert.equal((await deliver(paymentEvent(ch3, 250000, 'live'))).status, 200)
    assert.equal((await db.order.findUnique({ where: { id: o3.order.id } }))!.status, 'PENDING_PAYMENT')
    ok('an event from the other mode (live vs test) is ignored')

    // 6. Correct payment marks it paid; the same delivery again changes nothing.
    const good = paymentEvent(ch3, 250000)
    const webhookId = rid('msg')
    assert.deepEqual((await deliver(good, { webhookId })).body, { received: true })
    assert.equal((await deliver(good, { webhookId })).body.duplicate, true)
    assert.equal((await deliver(good)).status, 200) // re-sent by Yoco under a new delivery id
    row = (await db.order.findUnique({ where: { id: o3.order.id } }))!
    assert.equal(row.status, 'PAID')
    assert.equal(await db.orderEvent.count({ where: { orderId: row.id, kind: 'paid' } }), 1, 'paid exactly once')
    assert.equal(await stock(), 0)
    ok('a valid payment marks the order paid exactly once, even when delivered three times')

    // 7. A second, different payment for an already-paid order is flagged as a possible duplicate charge.
    assert.equal((await deliver(paymentEvent(ch3, 250000))).status, 200)
    assert.ok((await db.order.findUnique({ where: { id: row.id } }))!.needsAttention?.includes('second payment'))
    ok('a second payment on a paid order is flagged for refund')

    // 8. Payment arrives after the order expired and the suit was sold to someone else.
    await db.variant.update({ where: { id: variantId }, data: { stock: 1 } })
    const late = await order('late@example.com'); assert.ok(late.ok); created.push(late.order.id)
    const chLate = await withCheckout(late.order.id)
    await abandonOrder(late.order.id, 'test: hold expired')
    const other = await order('other@example.com'); assert.ok(other.ok); created.push(other.order.id)
    assert.equal(await stock(), 0)
    assert.equal((await deliver(paymentEvent(chLate, 250000))).status, 200)
    row = (await db.order.findUnique({ where: { id: late.order.id } }))!
    assert.equal(row.status, 'PAID', 'money was taken, so the order must not be lost')
    assert.ok(row.needsAttention?.includes('no longer in stock'))
    assert.equal(await stock(), 0, 'stock never goes negative')
    ok('a late payment after the stock was resold is recorded as paid and flagged, without overselling')

    console.log(`\n${passed} payment edge cases passed.`)
  } finally {
    await db.order.deleteMany({ where: { id: { in: created } } })
    await db.order.deleteMany({ where: { email: { in: ['race-a@example.com', 'race-b@example.com'] } } })
    await db.product.delete({ where: { id: product.id } })
  }
}

main()
  .catch((err) => {
    console.error('\nFAILED:', err.message)
    process.exitCode = 1
  })
  .finally(() => process.exit())
