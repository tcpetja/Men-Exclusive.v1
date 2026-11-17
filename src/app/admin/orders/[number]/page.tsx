import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { orderManualRefundAction, orderNoteAction, orderRefundAction, orderResendAction, orderResolveAction, orderStatusAction } from '@/app/actions/admin'
import { ACheck, AdminForm, AField } from '@/components/admin/AdminForm'
import { StatusPill, fmtDateTime } from '@/components/admin/bits'
import { allowedTransitions, orderStatusLabel } from '@/lib/constants'
import { db } from '@/lib/db'
import { emailConfigured } from '@/lib/email'
import { formatZAR } from '@/lib/money'
import { canRefund } from '@/lib/orders'
import { waLink, waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Order' }

const NEXT_LABEL: Record<string, string> = {
  PROCESSING: 'Start preparing',
  READY_FOR_COLLECTION: 'Mark as ready for collection',
  DISPATCHED: 'Mark as dispatched',
  DELIVERED: 'Mark as delivered',
  CANCELLED: 'Cancel order',
}

export default async function AdminOrder({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  const order = await db.order.findUnique({ where: { number }, include: { items: true, events: { orderBy: { createdAt: 'desc' } }, user: { select: { id: true } } } })
  if (!order) notFound()
  const next = allowedTransitions(order.status, order.fulfilmentType)
  const collection = order.fulfilmentType === 'COLLECTION'
  const refundable = canRefund(order.status)
  const remaining = order.totalCents - order.refundedCents

  return (
    <>
      <p style={{ marginBottom: 10 }}>
        <Link href="/admin/orders">Back to all orders</Link>
      </p>
      <div className="a-head">
        <div>
          <h1 className="a-title">Order {order.number}</h1>
          <p className="a-sub">
            Placed {fmtDateTime(order.createdAt)}
            {order.paidAt ? `, paid ${fmtDateTime(order.paidAt)}` : ''}
          </p>
        </div>
        <StatusPill status={order.status} fulfilment={order.fulfilmentType} />
      </div>

      {order.needsAttention && (
        <div className="a-note a-note-bad" style={{ marginBottom: 18 }}>
          <strong>Needs attention.</strong> {order.needsAttention}
          <form action={orderResolveAction} style={{ marginTop: 10 }}>
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className="a-btn a-btn-sm">
              Mark as resolved
            </button>
          </form>
        </div>
      )}

      <div className="a-grid a-grid-2">
        <div>
          <section className="a-card">
            <h2>Items</h2>
            <div className="a-table-wrap" style={{ marginTop: 10 }}>
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Colour and size</th>
                    <th className="a-num">Qty</th>
                    <th className="a-num">Each</th>
                    <th className="a-num">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.name}
                        <div className="a-meta">Ref {i.sku}</div>
                      </td>
                      <td>
                        {i.colour}, size {i.size}
                      </td>
                      <td className="a-num">{i.quantity}</td>
                      <td className="a-num">{formatZAR(i.unitCents)}</td>
                      <td className="a-num">{formatZAR(i.unitCents * i.quantity)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="a-num">
                      Subtotal
                    </td>
                    <td className="a-num">{formatZAR(order.subtotalCents)}</td>
                  </tr>
                  {order.discountCents > 0 && (
                    <tr>
                      <td colSpan={4} className="a-num">
                        Discount {order.promoCode && `(${order.promoCode})`}
                      </td>
                      <td className="a-num">-{formatZAR(order.discountCents)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={4} className="a-num">
                      {order.deliveryMethodName}
                    </td>
                    <td className="a-num">{order.deliveryCents ? formatZAR(order.deliveryCents) : 'Free'}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="a-num">
                      <strong>Total</strong>
                    </td>
                    <td className="a-num">
                      <strong>{formatZAR(order.totalCents)}</strong>
                    </td>
                  </tr>
                  {order.refundedCents > 0 && (
                    <tr>
                      <td colSpan={4} className="a-num">
                        Refunded
                      </td>
                      <td className="a-num">-{formatZAR(order.refundedCents)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="a-card">
            <h2>Next step</h2>
            {next.length === 0 ? (
              <p className="a-help">
                This order is {orderStatusLabel(order.status, order.fulfilmentType).toLowerCase()}. {order.status === 'PENDING_PAYMENT' ? '' : 'There is nothing further to do.'}
              </p>
            ) : (
              <>
                <p className="a-help">{emailConfigured() ? 'The customer is emailed each time the status changes.' : 'Email is not connected yet, so customers are not emailed when the status changes.'}</p>
                <AdminForm action={orderStatusAction} hidden={{ orderId: order.id }} submitLabel="Update status">
                  <AField label="Move this order to" name="to" options={next.map((s) => ({ value: s, label: NEXT_LABEL[s] ?? orderStatusLabel(s, order.fulfilmentType) }))} />
                  {!collection && (
                    <div className="a-row">
                      <AField label="Tracking number" name="trackingNumber" defaultValue={order.trackingNumber} help="Optional. Included in the dispatch email." />
                      <AField label="Tracking link" name="trackingUrl" defaultValue={order.trackingUrl} placeholder="https://" help="Optional." inputMode="url" />
                    </div>
                  )}
                  <AField label="Note for your records" name="note" help="Optional. Customers do not see this." />
                </AdminForm>
              </>
            )}
          </section>

          {refundable && (
            <section className="a-card">
              <h2>Refund</h2>
              <p className="a-help">
                A paid order is cancelled by refunding it. {formatZAR(remaining)} can still be refunded. If the order has not left the store, its items go back into stock automatically when it is refunded in full.
              </p>
              <details className="a-details">
                <summary>Refund through Yoco</summary>
                <div className="a-details-body">
                  <AdminForm action={orderRefundAction} hidden={{ orderId: order.id }} submitLabel="Send refund">
                    <AField label="Amount in Rand" name="amount" inputMode="decimal" placeholder={(remaining / 100).toFixed(2)} help="Leave empty to refund everything that is left." />
                    <ACheck name="confirm" label="I want to refund this payment to the customer's card." />
                  </AdminForm>
                </div>
              </details>
              <details className="a-details">
                <summary>Record a refund made elsewhere</summary>
                <div className="a-details-body">
                  <AdminForm action={orderManualRefundAction} hidden={{ orderId: order.id }} submitLabel="Mark as refunded">
                    <AField label="How was it refunded?" name="note" placeholder="For example: refunded in the Yoco app" />
                    <ACheck name="confirm" label="The customer has already been refunded in full." />
                  </AdminForm>
                </div>
              </details>
            </section>
          )}

          <section className="a-card">
            <h2>History</h2>
            <ol className="a-timeline" style={{ marginTop: 10 }}>
              {order.events.map((e) => (
                <li key={e.id}>
                  <time>
                    {fmtDateTime(e.createdAt)}, {e.actor}
                  </time>
                  {e.message}
                </li>
              ))}
            </ol>
            <div style={{ marginTop: 16 }}>
              <AdminForm action={orderNoteAction} hidden={{ orderId: order.id }} submitLabel="Add note">
                <AField label="Add an internal note" name="note" rows={2} />
              </AdminForm>
            </div>
          </section>
        </div>

        <div>
          <section className="a-card">
            <h2>Customer</h2>
            <dl className="a-dl" style={{ marginTop: 10 }}>
              <dt>Name</dt>
              <dd>
                {order.firstName} {order.lastName}
              </dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${order.email}`}>{order.email}</a>
              </dd>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${order.phone}`}>{order.phone}</a>
              </dd>
              <dt>Account</dt>
              <dd>{order.user ? 'Registered customer' : 'Guest checkout'}</dd>
            </dl>
            <div className="a-actions" style={{ marginTop: 14 }}>
              <a className="a-btn a-btn-sm" href={waLink(order.phone, `Good day ${order.firstName}. This is MEN EXCLUSIVE about your order ${order.number}.`)} target="_blank" rel="noopener noreferrer">
                WhatsApp customer
              </a>
              <a className="a-btn a-btn-sm" href={`/order/${order.publicToken}`} target="_blank">
                Customer's view
              </a>
            </div>
            {order.customerNote && (
              <div className="a-note" style={{ marginTop: 14 }}>
                <strong>Customer note:</strong> {order.customerNote}
              </div>
            )}
          </section>

          <section className="a-card">
            <h2>{collection ? 'Collection' : 'Delivery'}</h2>
            <p style={{ marginTop: 8 }}>{order.deliveryMethodName}</p>
            {!collection && (
              <address style={{ fontStyle: 'normal', marginTop: 8 }}>
                {[order.shipLine1, order.shipLine2, order.shipSuburb, order.shipCity, order.shipProvince, order.shipPostalCode].filter(Boolean).map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </address>
            )}
            {order.trackingNumber && <p className="a-meta" style={{ marginTop: 8 }}>Tracking: {order.trackingNumber}</p>}
          </section>

          <section className="a-card">
            <h2>Payment</h2>
            <dl className="a-dl" style={{ marginTop: 10 }}>
              <dt>Status</dt>
              <dd>{order.paidAt ? 'Paid' : order.status === 'PENDING_PAYMENT' ? 'Waiting for payment' : 'Not paid'}</dd>
              <dt>Mode</dt>
              <dd>{order.yocoMode === 'live' ? 'Live' : order.yocoMode === 'test' ? 'Test (no money taken)' : 'Not started'}</dd>
              <dt>Yoco checkout</dt>
              <dd style={{ wordBreak: 'break-all' }}>{order.yocoCheckoutId ?? 'None'}</dd>
              <dt>Yoco payment</dt>
              <dd style={{ wordBreak: 'break-all' }}>{order.yocoPaymentId ?? 'None'}</dd>
            </dl>
            {order.paidAt && (
              <div style={{ marginTop: 14 }}>
                <AdminForm action={orderResendAction} hidden={{ orderId: order.id }} submitLabel="Send confirmation email again" />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
