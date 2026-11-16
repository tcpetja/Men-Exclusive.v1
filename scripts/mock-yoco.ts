/**
 * LOCAL DEVELOPMENT ONLY — a stand-in for Yoco's Checkout API.
 *
 * It lets you rehearse the whole purchase on your own machine without a Yoco account: the website creates
 * a checkout here, you "pay" on a plain test page, and this script sends the website a correctly signed
 * webhook, exactly as Yoco does. No money is involved and nothing here runs in production
 * (the website only talks to it when YOCO_MODE=test and YOCO_API_BASE points at it).
 *
 *   1. In .env:  YOCO_MODE=test
 *                YOCO_TEST_SECRET_KEY=sk_test_local
 *                YOCO_TEST_WEBHOOK_SECRET=whsec_bG9jYWwtZGV2ZWxvcG1lbnQtb25seQ==
 *                YOCO_API_BASE=http://localhost:4010
 *   2. npm run yoco:mock        (in a second terminal)
 *   3. npm run dev
 */
import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { signWebhook } from '../src/lib/yoco'

const PORT = Number(process.env.MOCK_YOCO_PORT || 4010)
const SITE = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
const SECRET = process.env.YOCO_TEST_WEBHOOK_SECRET || 'whsec_bG9jYWwtZGV2ZWxvcG1lbnQtb25seQ=='
const WEBHOOK_DELAY_MS = Number(process.env.MOCK_YOCO_WEBHOOK_DELAY_MS || 1500)

type Checkout = {
  id: string
  amount: number
  currency: string
  successUrl?: string
  cancelUrl?: string
  failureUrl?: string
  metadata: Record<string, unknown>
  status: string
  paymentId: string | null
  refunded: number
}
const checkouts = new Map<string, Checkout>()
const byIdempotencyKey = new Map<string, string>()
const id = (prefix: string) => `${prefix}_${randomBytes(9).toString('base64url')}`

async function body(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function sendWebhook(type: string, payload: Record<string, unknown>) {
  const event = { id: id('evt'), type, createdDate: new Date().toISOString(), payload }
  const raw = JSON.stringify(event)
  const webhookId = id('msg')
  const timestamp = String(Math.floor(Date.now() / 1000))
  try {
    const res = await fetch(`${SITE}/api/webhooks/yoco`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'webhook-id': webhookId, 'webhook-timestamp': timestamp, 'webhook-signature': signWebhook(webhookId, timestamp, raw, SECRET) },
      body: raw,
    })
    console.log(`[mock-yoco] webhook ${type} → ${res.status} ${await res.text()}`)
  } catch (err) {
    console.error('[mock-yoco] webhook delivery failed:', err)
  }
}

const page = (c: Checkout) => `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test payment</title>
<body style="font-family:system-ui;max-width:440px;margin:8vh auto;padding:0 20px;color:#111">
<p style="background:#fff3cd;padding:10px 14px;border-radius:6px"><strong>Local test page.</strong> This is not Yoco and no money is taken.</p>
<h1 style="font-size:1.4rem">Pay R ${(c.amount / 100).toFixed(2)}</h1>
<p>Checkout ${c.id}</p>
<form method="post" action="/pay/${c.id}/success"><button id="pay" style="padding:14px 20px;font-size:1rem;width:100%;margin:6px 0">Approve payment</button></form>
<form method="post" action="/pay/${c.id}/fail"><button id="decline" style="padding:14px 20px;font-size:1rem;width:100%;margin:6px 0">Decline payment</button></form>
<form method="post" action="/pay/${c.id}/cancel"><button id="cancel" style="padding:14px 20px;font-size:1rem;width:100%;margin:6px 0">Cancel and go back</button></form>
</body></html>`

createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const path = url.pathname
  try {
    if (path.startsWith('/api/')) {
      const auth = req.headers.authorization || ''
      if (!auth.startsWith('Bearer sk_test_')) return json(res, 403, { message: 'A test secret key (sk_test_…) is required.' })
    }

    if (req.method === 'POST' && path === '/api/checkouts') {
      const key = String(req.headers['idempotency-key'] || '')
      if (key && byIdempotencyKey.has(key)) return json(res, 200, view(checkouts.get(byIdempotencyKey.get(key)!)!))
      const input = JSON.parse((await body(req)) || '{}')
      if (!Number.isInteger(input.amount) || input.amount < 200) return json(res, 422, { message: 'amount must be an integer of at least 200 cents' })
      if (input.currency !== 'ZAR') return json(res, 422, { message: 'currency must be ZAR' })
      const checkoutId = id('ch')
      const checkout: Checkout = {
        id: checkoutId,
        amount: input.amount,
        currency: 'ZAR',
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        failureUrl: input.failureUrl,
        metadata: { ...(input.metadata || {}), checkoutId, paymentFacilitator: 'yoco-online-checkout' },
        status: 'created',
        paymentId: null,
        refunded: 0,
      }
      checkouts.set(checkoutId, checkout)
      if (key) byIdempotencyKey.set(key, checkoutId)
      return json(res, 200, view(checkout))
    }

    const refund = /^\/api\/checkouts\/([^/]+)\/refund$/.exec(path)
    if (req.method === 'POST' && refund) {
      const checkout = checkouts.get(refund[1])
      if (!checkout || !checkout.paymentId) return json(res, 422, { message: 'This checkout has no successful payment to refund.' })
      const input = JSON.parse((await body(req)) || '{}')
      const amount = Number.isInteger(input.amount) ? input.amount : checkout.amount - checkout.refunded
      if (amount < 1 || amount > checkout.amount - checkout.refunded) return json(res, 422, { message: 'Refund amount exceeds the refundable amount.' })
      checkout.refunded += amount
      const refundId = id('rfd')
      setTimeout(
        () => sendWebhook('refund.succeeded', { id: refundId, type: 'refund', createdDate: new Date().toISOString(), amount, currency: 'ZAR', mode: 'test', status: 'succeeded', refundableAmount: checkout.amount - checkout.refunded, metadata: checkout.metadata }),
        WEBHOOK_DELAY_MS,
      )
      return json(res, 200, { id: checkout.id, refundId, message: 'Refund accepted', status: 'pending' })
    }

    if (path === '/api/webhooks' && req.method === 'GET') return json(res, 200, { subscriptions: [{ id: 'sub_local', name: 'local', url: `${SITE}/api/webhooks/yoco`, mode: 'test' }] })
    if (path === '/api/webhooks' && req.method === 'POST') {
      const input = JSON.parse((await body(req)) || '{}')
      return json(res, 201, { id: 'sub_local', name: input.name, url: input.url, mode: 'test', secret: SECRET })
    }

    const pay = /^\/pay\/([^/]+)(?:\/(success|fail|cancel))?$/.exec(path)
    if (pay) {
      const checkout = checkouts.get(pay[1])
      if (!checkout) {
        res.writeHead(404)
        return res.end('Unknown checkout')
      }
      if (req.method === 'GET' && !pay[2]) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(page(checkout))
      }
      if (req.method === 'POST' && pay[2] === 'success') {
        checkout.status = 'completed'
        checkout.paymentId = id('p')
        const payload = {
          id: checkout.paymentId,
          type: 'payment',
          createdDate: new Date().toISOString(),
          amount: checkout.amount,
          currency: 'ZAR',
          mode: 'test',
          status: 'succeeded',
          metadata: checkout.metadata,
          paymentMethodDetails: { type: 'card', card: { maskedCard: '************1111', scheme: 'visa', expiryMonth: 12, expiryYear: 2030 } },
        }
        setTimeout(() => sendWebhook('payment.succeeded', payload), WEBHOOK_DELAY_MS)
        res.writeHead(303, { Location: checkout.successUrl || SITE })
        return res.end()
      }
      if (req.method === 'POST') {
        res.writeHead(303, { Location: (pay[2] === 'fail' ? checkout.failureUrl : checkout.cancelUrl) || SITE })
        return res.end()
      }
    }
    json(res, 404, { message: 'Not found' })
  } catch (err) {
    console.error('[mock-yoco]', err)
    json(res, 500, { message: 'Mock server error' })
  }
}).listen(PORT, '127.0.0.1', () => console.log(`[mock-yoco] listening on http://localhost:${PORT} — webhooks go to ${SITE}/api/webhooks/yoco`))

function view(c: Checkout) {
  return {
    id: c.id,
    redirectUrl: `http://localhost:${PORT}/pay/${c.id}`,
    status: c.status,
    amount: c.amount,
    currency: c.currency,
    paymentId: c.paymentId,
    successUrl: c.successUrl ?? null,
    cancelUrl: c.cancelUrl ?? null,
    failureUrl: c.failureUrl ?? null,
    metadata: c.metadata,
    processingMode: 'test',
  }
}
