import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClearBagOnPaid, PaymentWatcher } from '@/components/checkout/PaymentWatcher'
import { WhatsAppButton } from '@/components/WhatsApp'
import { getCurrentUser } from '@/lib/auth'
import { orderStatusLabel } from '@/lib/constants'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'
import { addressLines, getSettings } from '@/lib/settings'
import { waMessages } from '@/lib/whatsapp'
import type { OrderStatus } from '@/generated/prisma/enums'

export const metadata: Metadata = { title: 'Your order', robots: { index: false, follow: false } }

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ payment?: string }> }

const RANK: Record<OrderStatus, number> = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  PROCESSING: 2,
  READY_FOR_COLLECTION: 3,
  DISPATCHED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
}

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ token }, { payment }] = await Promise.all([params, searchParams])
  if (token.length > 80) notFound()
  const order = await db.order.findUnique({ where: { publicToken: token }, include: { items: true } })
  if (!order) notFound()
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])

  const returned = payment === 'success' || payment === 'cancelled' || payment === 'failed' ? payment : null
  const pending = order.status === 'PENDING_PAYMENT'
  const closed = order.status === 'CANCELLED' || order.status === 'REFUNDED'
  const collection = order.fulfilmentType === 'COLLECTION'
  const rank = RANK[order.status]
  const steps = [
    { label: 'Order placed', done: true },
    { label: 'Payment confirmed', done: rank >= 1 },
    { label: 'Being prepared', done: rank >= 2 },
    { label: collection ? 'Ready for collection' : 'Dispatched', done: rank >= 3 },
    { label: collection ? 'Collected' : 'Delivered', done: rank >= 4 },
  ]
  const date = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }).format(order.createdAt)
  const heading = pending
    ? returned === 'success'
      ? 'Almost there'
      : 'Complete your order'
    : order.status === 'CANCELLED'
      ? 'This order was cancelled'
      : order.status === 'REFUNDED'
        ? 'This order was refunded'
        : `Thank you, ${order.firstName}`

  return (
    <div className="wrap">
      <header className="pagehead">
        <p className="muted">
          Order {order.number}, placed {date}
        </p>
        <h1 className="display">{heading}</h1>
        {!pending && !closed && order.status === 'PAID' && (
          <p className="lede">
            Your payment has been received and your order is confirmed. We have emailed a confirmation to {order.email}.
          </p>
        )}
        <div>
          <span className={`status ${rank >= 1 ? 'status-ok' : closed ? 'status-bad' : ''}`}>{orderStatusLabel(order.status, order.fulfilmentType)}</span>
        </div>
      </header>

      <div className="checkout" style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <div className="stack-lg">
          {pending && <PaymentWatcher token={order.publicToken} returned={returned} payUrl={order.yocoRedirectUrl} />}
          {!pending && returned === 'success' && order.status === 'PAID' && <ClearBagOnPaid token={order.publicToken} />}
          {order.status === 'CANCELLED' && (
            <p className="notice">
              No payment was taken for this order and its items have been released. You are welcome to{' '}
              <Link href="/shop" className="link">
                shop again
              </Link>
              .
            </p>
          )}
          {order.status === 'REFUNDED' && <p className="notice">A refund was issued to your original payment method. Banks usually take a few business days to show it.</p>}

          {!closed && (
            <section className="stack">
              <h2 className="step-title">Progress</h2>
              <ol className="timeline">
                {steps.map((s) => (
                  <li key={s.label} data-done={s.done}>
                    <span>{s.label}</span>
                  </li>
                ))}
              </ol>
              {order.trackingNumber && (
                <p className="soft">
                  Tracking number: <strong style={{ color: 'var(--text)' }}>{order.trackingNumber}</strong>
                  {order.trackingUrl && /^https:\/\//.test(order.trackingUrl) && (
                    <>
                      {' '}
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="link">
                        Track your parcel
                      </a>
                    </>
                  )}
                </p>
              )}
            </section>
          )}

          <section className="stack">
            <h2 className="step-title">Items</h2>
            <ul>
              {order.items.map((item) => (
                <li key={item.id} className="line">
                  <div className="line-media">{item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="84px" />}</div>
                  <div className="line-body">
                    <div className="line-top">
                      {item.slug ? <Link href={`/shop/${item.slug}`}>{item.name}</Link> : <span>{item.name}</span>}
                      <span className="price">{formatZAR(item.unitCents * item.quantity)}</span>
                    </div>
                    <div className="line-meta">
                      {item.colour}, size {item.size}, quantity {item.quantity}
                    </div>
                    <div className="line-meta">Ref {item.sku}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="infogrid infogrid-2">
            <div className="info">
              <h3>{collection ? 'Collection' : 'Delivery'}</h3>
              <p>{order.deliveryMethodName}</p>
              {collection ? (
                <address>
                  {addressLines(settings).map((l) => (
                    <div key={l}>{l}</div>
                  ))}
                </address>
              ) : (
                <address>
                  {[order.shipLine1, order.shipLine2, order.shipSuburb, order.shipCity, order.shipProvince, order.shipPostalCode].filter(Boolean).map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </address>
              )}
              {order.deliveryNote && <p className="muted">{order.deliveryNote}</p>}
            </div>
            <div className="info">
              <h3>Your details</h3>
              <p>
                {order.firstName} {order.lastName}
              </p>
              <p>{order.email}</p>
              <p>{order.phone}</p>
            </div>
          </section>
        </div>

        <aside className="panel checkout-summary stack">
          <h2 className="step-title">Summary</h2>
          <div className="totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{formatZAR(order.subtotalCents)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="totals-row">
                <span>Discount{order.promoCode ? ` (${order.promoCode})` : ''}</span>
                <span>-{formatZAR(order.discountCents)}</span>
              </div>
            )}
            <div className="totals-row">
              <span>{order.deliveryMethodName}</span>
              <span>{order.deliveryCents > 0 ? formatZAR(order.deliveryCents) : 'Free'}</span>
            </div>
            <div className="totals-row totals-total">
              <span>{pending ? 'Total to pay' : 'Total'}</span>
              <span>{formatZAR(order.totalCents)}</span>
            </div>
            {order.refundedCents > 0 && (
              <div className="totals-row">
                <span>Refunded</span>
                <span>-{formatZAR(order.refundedCents)}</span>
              </div>
            )}
          </div>
          <WhatsAppButton message={waMessages.order(order.number)} className="btn btn-line btn-block">
            Get help with this order
          </WhatsAppButton>
          {user ? (
            <Link href="/account" className="btn btn-line btn-block">
              Your orders
            </Link>
          ) : (
            !pending &&
            !closed && (
              <div className="stack" style={{ gap: 10 }}>
                <p className="soft" style={{ fontSize: '0.9rem' }}>
                  Create an account to see this order and future orders in one place.
                </p>
                <Link href={`/account/register?order=${order.publicToken}`} className="btn btn-gold btn-block">
                  Create an account
                </Link>
              </div>
            )
          )}
          <p className="muted" style={{ fontSize: '0.8rem' }}>
            Keep this page’s address private. Anyone with the link can see this order.
          </p>
        </aside>
      </div>
    </div>
  )
}
