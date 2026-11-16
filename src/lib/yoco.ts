/**
 * Yoco Checkout API integration (https://developer.yoco.com — Checkout API).
 *
 * How it works:
 *   1. Our server creates a checkout (POST /api/checkouts) with the secret key.
 *   2. The customer is redirected to Yoco's hosted payment page (redirectUrl).
 *   3. Yoco calls our webhook (payment.succeeded). We verify the signature and only then mark the order as paid.
 *
 * The browser redirect back to the site is never treated as proof of payment.
 * Card details never touch this website — they are entered on Yoco's page.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { siteUrl } from './settings'

export type YocoMode = 'test' | 'live'

export type YocoConfig = {
  mode: YocoMode
  secretKey: string | null
  webhookSecret: string | null
  apiBase: string
  /** Human-readable reasons why payments cannot be taken yet. Empty when ready. */
  problems: string[]
}

const DEFAULT_API_BASE = 'https://payments.yoco.com'

export function yocoConfig(env: Record<string, string | undefined> = process.env): YocoConfig {
  const mode: YocoMode = env.YOCO_MODE === 'live' ? 'live' : 'test'
  const rawKey = (mode === 'live' ? env.YOCO_LIVE_SECRET_KEY : env.YOCO_TEST_SECRET_KEY)?.trim() || null
  const rawWebhook = (mode === 'live' ? env.YOCO_LIVE_WEBHOOK_SECRET : env.YOCO_TEST_WEBHOOK_SECRET)?.trim() || null
  const problems: string[] = []
  const upper = mode.toUpperCase()

  let secretKey = rawKey
  if (!rawKey) {
    problems.push(`YOCO_${upper}_SECRET_KEY is not set.`)
  } else if (!rawKey.startsWith(`sk_${mode}_`)) {
    problems.push(`YOCO_${upper}_SECRET_KEY must start with "sk_${mode}_" — it looks like the wrong key for ${mode} mode.`)
    secretKey = null
  }

  let webhookSecret = rawWebhook
  if (!rawWebhook) {
    problems.push(`YOCO_${upper}_WEBHOOK_SECRET is not set. Run "npm run yoco:webhook register" to create it.`)
  } else if (!rawWebhook.startsWith('whsec_')) {
    problems.push(`YOCO_${upper}_WEBHOOK_SECRET must start with "whsec_".`)
    webhookSecret = null
  }

  // A custom API base is only honoured in test mode (used by the local mock in scripts/mock-yoco.ts).
  const apiBase = mode === 'test' && env.YOCO_API_BASE ? env.YOCO_API_BASE.replace(/\/+$/, '') : DEFAULT_API_BASE

  return { mode, secretKey, webhookSecret, apiBase, problems }
}

/** True when the site can take real online payments end to end (create checkouts AND verify webhooks). */
export function paymentsReady(config = yocoConfig()): boolean {
  return Boolean(config.secretKey && config.webhookSecret)
}

export class YocoError extends Error {
  constructor(
    message: string,
    public status?: number,
    public detail?: unknown,
  ) {
    super(message)
    this.name = 'YocoError'
  }
}

async function yocoFetch<T>(path: string, init: { method: string; body?: unknown; idempotencyKey?: string }): Promise<T> {
  const config = yocoConfig()
  if (!config.secretKey) throw new YocoError('Yoco is not configured: ' + config.problems.join(' '))
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.secretKey}`,
    'Content-Type': 'application/json',
  }
  if (init.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey

  let res: Response
  try {
    res = await fetch(config.apiBase + path, {
      method: init.method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(20_000),
      cache: 'no-store',
    })
  } catch (err) {
    throw new YocoError('Could not reach Yoco: ' + (err instanceof Error ? err.message : String(err)))
  }
  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const j = json as { message?: string; description?: string; reason?: string } | null
    const message = j?.message || j?.description || j?.reason || text.slice(0, 200) || res.statusText
    throw new YocoError(`Yoco responded ${res.status}: ${message}`, res.status, json)
  }
  return json as T
}

export type YocoCheckout = {
  id: string
  redirectUrl: string
  status: string
  amount: number
  currency: string
  paymentId: string | null
  processingMode: YocoMode
}

/** Yoco does not accept payments below R2.00. */
export const YOCO_MIN_CENTS = 200

export async function createCheckout(order: {
  id: string
  number: string
  publicToken: string
  totalCents: number
}): Promise<YocoCheckout> {
  const base = siteUrl()
  const back = `${base}/order/${order.publicToken}`
  const checkout = await yocoFetch<YocoCheckout>('/api/checkouts', {
    method: 'POST',
    // The same order always produces the same checkout if the request is retried.
    idempotencyKey: `order-${order.id}`,
    body: {
      amount: order.totalCents,
      currency: 'ZAR',
      successUrl: `${back}?payment=success`,
      cancelUrl: `${back}?payment=cancelled`,
      failureUrl: `${back}?payment=failed`,
      externalId: order.number,
      clientReferenceId: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
    },
  })
  if (!checkout?.id || !checkout.redirectUrl) throw new YocoError('Yoco returned an unexpected response.', 200, checkout)
  return checkout
}

export type YocoRefund = { id: string; refundId?: string; message?: string; status?: string }

/** Refunds a checkout in full, or partially when amountCents is given. The final outcome arrives by webhook. */
export async function refundCheckout(checkoutId: string, amountCents?: number, idempotencyKey?: string): Promise<YocoRefund> {
  return yocoFetch<YocoRefund>(`/api/checkouts/${encodeURIComponent(checkoutId)}/refund`, {
    method: 'POST',
    idempotencyKey,
    body: amountCents ? { amount: amountCents } : {},
  })
}

export type YocoWebhookSubscription = { id: string; name: string; url: string; mode: YocoMode; secret?: string }

export const yocoWebhooks = {
  list: () => yocoFetch<{ subscriptions: YocoWebhookSubscription[] }>('/api/webhooks', { method: 'GET' }),
  register: (name: string, url: string) =>
    yocoFetch<YocoWebhookSubscription>('/api/webhooks', { method: 'POST', body: { name, url } }),
  remove: (id: string) => yocoFetch<{ message: string }>(`/api/webhooks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

// ───────────────────────── Webhook verification ─────────────────────────

export type SignatureCheck = { ok: true } | { ok: false; reason: string }

/**
 * Verifies a Yoco webhook delivery.
 * Signed content is `${webhook-id}.${webhook-timestamp}.${rawBody}`, signed with HMAC-SHA256 using the
 * base64-decoded part of the secret after "whsec_". The header holds one or more space-separated "v1,<base64>" values.
 */
export function verifyWebhookSignature(input: {
  id: string | null
  timestamp: string | null
  signature: string | null
  rawBody: string
  secret: string
  toleranceSeconds?: number
  now?: number
}): SignatureCheck {
  const { id, timestamp, signature, rawBody, secret } = input
  if (!id || !timestamp || !signature) return { ok: false, reason: 'Missing webhook-id, webhook-timestamp or webhook-signature header.' }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return { ok: false, reason: 'Invalid webhook-timestamp.' }
  const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000)
  const tolerance = input.toleranceSeconds ?? 180
  if (Math.abs(nowSeconds - ts) > tolerance) return { ok: false, reason: 'Webhook timestamp is outside the allowed window.' }

  const secretPart = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  const key = Buffer.from(secretPart, 'base64')
  if (key.length === 0) return { ok: false, reason: 'Webhook secret is not valid base64.' }

  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest()

  for (const part of signature.split(' ')) {
    const [version, value] = part.split(',')
    if (version !== 'v1' || !value) continue
    const candidate = Buffer.from(value, 'base64')
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return { ok: true }
  }
  return { ok: false, reason: 'Signature does not match.' }
}

/** Builds a valid signature header — used by tests and the local mock server only. */
export function signWebhook(id: string, timestamp: string, rawBody: string, secret: string): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  return 'v1,' + createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64')
}

export type YocoEvent = {
  id: string
  type: string
  createdDate?: string
  payload: {
    id: string
    type?: string
    amount: number
    currency: string
    mode: YocoMode
    status?: string
    refundableAmount?: number
    metadata?: Record<string, unknown> & { checkoutId?: string; orderId?: string; orderNumber?: string }
    paymentMethodDetails?: { type?: string; card?: { maskedCard?: string; scheme?: string } }
  }
}
