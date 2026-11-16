import type { Metadata } from 'next'
import Link from 'next/link'
import { StatusPill, fmtDateTime } from '@/components/admin/bits'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'
import { expireStaleOrders } from '@/lib/orders'
import type { Prisma } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Orders' }

const FILTERS: { id: string; label: string; where: Prisma.OrderWhereInput }[] = [
  { id: 'all', label: 'All', where: {} },
  { id: 'to-fulfil', label: 'To prepare', where: { status: { in: ['PAID', 'PROCESSING'] } } },
  { id: 'attention', label: 'Needs attention', where: { needsAttention: { not: null } } },
  { id: 'ready', label: 'Ready or dispatched', where: { status: { in: ['READY_FOR_COLLECTION', 'DISPATCHED'] } } },
  { id: 'done', label: 'Completed', where: { status: 'DELIVERED' } },
  { id: 'pending', label: 'Pending payment', where: { status: 'PENDING_PAYMENT' } },
  { id: 'closed', label: 'Cancelled or refunded', where: { status: { in: ['CANCELLED', 'REFUNDED'] } } },
]

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = 'all', q = '' } = await searchParams
  await expireStaleOrders().catch(() => 0)
  const filter = FILTERS.find((f) => f.id === status) ?? FILTERS[0]
  const term = q.trim().slice(0, 60)
  const search: Prisma.OrderWhereInput = term
    ? {
        OR: [
          { number: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { phone: { contains: term.replace(/\s/g, '') } },
        ],
      }
    : {}
  const orders = await db.order.findMany({ where: { AND: [filter.where, search] }, orderBy: { createdAt: 'desc' }, take: 200, include: { items: { select: { quantity: true } } } })

  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Orders</h1>
          <p className="a-sub">An order is only marked as paid once Yoco has confirmed the payment.</p>
        </div>
        <form method="get" className="a-actions">
          <input type="hidden" name="status" value={filter.id} />
          <label className="sr-only" htmlFor="order-q">
            Search orders
          </label>
          <input id="order-q" name="q" className="a-input" defaultValue={term} placeholder="Order number, name, email or phone" style={{ width: 280 }} />
          <button type="submit" className="a-btn">
            Search
          </button>
        </form>
      </div>
      <div className="a-filters">
        {FILTERS.map((f) => (
          <Link key={f.id} href={`/admin/orders?status=${f.id}`} aria-current={f.id === filter.id}>
            {f.label}
          </Link>
        ))}
      </div>
      <section className="a-card">
        {orders.length === 0 ? (
          <p className="a-empty">{term ? `No orders match "${term}".` : 'No orders in this view.'}</p>
        ) : (
          <div className="a-table-wrap" style={{ marginTop: -20 }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Placed</th>
                  <th>Customer</th>
                  <th>Receive by</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="a-num">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.number}`}>{o.number}</Link>
                      {o.needsAttention && (
                        <div>
                          <span className="a-pill a-pill-bad">Needs attention</span>
                        </div>
                      )}
                    </td>
                    <td>{fmtDateTime(o.createdAt)}</td>
                    <td>
                      {o.firstName} {o.lastName}
                      <div className="a-meta">{o.email}</div>
                    </td>
                    <td>{o.fulfilmentType === 'COLLECTION' ? 'Collection' : 'Delivery'}</td>
                    <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td>
                      <StatusPill status={o.status} fulfilment={o.fulfilmentType} />
                    </td>
                    <td className="a-num">{formatZAR(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
