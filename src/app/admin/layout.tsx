import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/account'
import { AdminNav } from '@/components/admin/AdminNav'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import './admin.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { default: 'Store admin', template: '%s | MEN EXCLUSIVE admin' }, robots: { index: false, follow: false } }

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin()
  const [toFulfil, appointments, enquiries] = await Promise.all([
    db.order.count({ where: { OR: [{ status: { in: ['PAID', 'PROCESSING'] } }, { needsAttention: { not: null } }] } }),
    db.appointment.count({ where: { status: 'NEW' } }),
    db.enquiry.count({ where: { status: 'NEW' } }),
  ])
  return (
    <div className="admin">
      <aside className="a-side">
        <Link href="/admin" className="a-brand">
          MEN EXCLUSIVE
        </Link>
        <AdminNav badges={{ '/admin/orders': toFulfil, '/admin/appointments': appointments, '/admin/enquiries': enquiries }} />
        <div className="a-side-foot">
          <span>{user.email}</span>
          <Link href="/" target="_blank">
            View website
          </Link>
          <form action={logoutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="a-main">{children}</main>
    </div>
  )
}
