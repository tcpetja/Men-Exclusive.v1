import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { orderStatusLabel } from '@/lib/constants'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'

export const metadata: Metadata = { title: 'Your orders', robots: { index: false } }

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const [user, { reset }] = await Promise.all([requireUser(), searchParams])
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { items: { select: { quantity: true } } }, take: 100 })
  const fmt = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'Africa/Johannesburg' })

  return (
    <section className="stack">
      {reset && <p className="notice notice-ok">Your password has been changed.</p>}
      <h2 className="display-sm">Your orders</h2>
      {orders.length === 0 ? (
        <div className="empty" style={{ paddingTop: 12 }}>
          <p className="soft">You have not placed an order with this account yet.</p>
          <Link href="/shop" className="btn btn-gold">
            Shop suits
          </Link>
        </div>
      ) : (
        <div className="rows">
          {orders.map((o) => {
            const count = o.items.reduce((n, i) => n + i.quantity, 0)
            const good = !['PENDING_PAYMENT', 'CANCELLED', 'REFUNDED'].includes(o.status)
            return (
              <Link key={o.id} href={`/order/${o.publicToken}`} className="row">
                <div>
                  <div className="row-title">{o.number}</div>
                  <div className="row-sub">
                    {fmt.format(o.createdAt)}, {count} {count === 1 ? 'item' : 'items'}, {formatZAR(o.totalCents)}
                  </div>
                </div>
                <span className={`status ${good ? 'status-ok' : o.status === 'PENDING_PAYMENT' ? '' : 'status-bad'}`}>{orderStatusLabel(o.status, o.fulfilmentType)}</span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
