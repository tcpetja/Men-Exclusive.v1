import type { Metadata } from 'next'
import { fmtDate } from '@/components/admin/bits'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'

export const metadata: Metadata = { title: 'Customers' }

export default async function AdminCustomers() {
  const [customers, subscribers] = await Promise.all([
    db.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { orders: { where: { paidAt: { not: null }, status: { notIn: ['CANCELLED', 'REFUNDED'] } }, select: { totalCents: true } } },
    }),
    db.subscriber.count(),
  ])
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Customers</h1>
          <p className="a-sub">People who have created an account. Guest orders appear under Orders. Handle this information in line with your privacy policy.</p>
        </div>
        <a href="/admin/customers/subscribers.csv" className="a-btn">
          Download newsletter list ({subscribers})
        </a>
      </div>
      <section className="a-card">
        {customers.length === 0 ? (
          <p className="a-empty">No customer accounts yet.</p>
        ) : (
          <div className="a-table-wrap" style={{ marginTop: -20 }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Joined</th>
                  <th>Newsletter</th>
                  <th className="a-num">Paid orders</th>
                  <th className="a-num">Total spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.firstName} {c.lastName}
                    </td>
                    <td>
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                      {c.phone && <div className="a-meta">{c.phone}</div>}
                    </td>
                    <td>{fmtDate(c.createdAt)}</td>
                    <td>{c.marketingOptIn ? 'Yes' : 'No'}</td>
                    <td className="a-num">{c.orders.length}</td>
                    <td className="a-num">{formatZAR(c.orders.reduce((n, o) => n + o.totalCents, 0))}</td>
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
