import { after } from 'next/server'
import { db } from '@/lib/db'
import { handlePaymentSucceeded, handleRefundEvent, type EventOutcome } from '@/lib/orders'
import { verifyWebhookSignature, yocoConfig, type YocoEvent } from '@/lib/yoco'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Yoco webhook endpoint. This is the ONLY place an order can become "Paid".
 *
 *  1. The raw request body is verified against Yoco's signature (HMAC-SHA256 with the webhook secret).
 *  2. Deliveries older than three minutes are rejected, which blocks replays.
 *  3. Every delivery is recorded so the same event is never processed twice.
 *
 * Register this URL with: npm run yoco:webhook register https://your-domain/api/webhooks/yoco
 */
export async function POST(request: Request) {
  const config = yocoConfig()
  if (!config.webhookSecret) {
    // Not configured: ask Yoco to retry later rather than silently dropping a real payment.
    console.error('[yoco-webhook] webhook secret is not configured for', config.mode, 'mode')
    return Response.json({ error: 'Webhook is not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const webhookId = request.headers.get('webhook-id')
  const check = verifyWebhookSignature({
    id: webhookId,
    timestamp: request.headers.get('webhook-timestamp'),
    signature: request.headers.get('webhook-signature'),
    rawBody,
    secret: config.webhookSecret,
  })
  if (!check.ok) {
    console.warn('[yoco-webhook] rejected:', check.reason)
    return Response.json({ error: 'Invalid signature' }, { status: 403 })
  }

  let event: YocoEvent
  try {
    event = JSON.parse(rawBody)
    if (!event || typeof event.type !== 'string' || !event.payload || typeof event.payload.amount !== 'number') throw new Error('unexpected shape')
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const deliveryId = webhookId!
  if (await db.webhookEvent.findUnique({ where: { id: deliveryId } })) {
    return Response.json({ received: true, duplicate: true })
  }

  let outcome: EventOutcome
  try {
    if (event.type === 'payment.succeeded') outcome = await handlePaymentSucceeded(event)
    else if (event.type === 'refund.succeeded' || event.type === 'refund.failed') outcome = await handleRefundEvent(event)
    else outcome = { result: `ignored: ${event.type}` }
  } catch (err) {
    // A 5xx makes Yoco retry, which is what we want if the database was briefly unavailable.
    console.error('[yoco-webhook] processing failed', err)
    return Response.json({ error: 'Processing failed' }, { status: 500 })
  }

  await db.webhookEvent.upsert({
    where: { id: deliveryId },
    create: { id: deliveryId, type: event.type, payload: { result: outcome.result, eventId: event.id ?? null, objectId: event.payload.id ?? null, amount: event.payload.amount, mode: event.payload.mode ?? null } },
    update: {},
  })
  console.info(`[yoco-webhook] ${event.type} → ${outcome.result}`)

  // Emails are sent after the response so Yoco gets its 200 quickly.
  if (outcome.notify) after(outcome.notify)
  return Response.json({ received: true })
}
