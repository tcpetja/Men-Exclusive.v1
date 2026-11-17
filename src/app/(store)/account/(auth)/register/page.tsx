import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RegisterForm } from '@/components/account/AccountForms'
import { getCurrentUser, safeNext } from '@/lib/auth'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; order?: string }> }) {
  const { next, order } = await searchParams
  if (await getCurrentUser()) redirect(safeNext(next, '/account'))
  // Arriving from a guest order: prefill the email so the order can be linked to the new account.
  const guestOrder = order && order.length <= 80 ? await db.order.findUnique({ where: { publicToken: order }, select: { email: true, userId: true } }) : null
  const linkable = guestOrder && !guestOrder.userId ? guestOrder : null
  return (
    <div className="wrap section-tight">
      <div className="auth">
        <div className="stack" style={{ gap: 10 }}>
          <h1 className="display">Create an account</h1>
          <p className="soft">
            {linkable ? 'Use the email address from your order and it will appear in your new account.' : 'Keep your details, addresses and order history in one place.'}
          </p>
        </div>
        <RegisterForm next={next} orderToken={linkable ? order : undefined} email={linkable?.email} />
        <p className="soft center">
          Already have an account?{' '}
          <Link href="/account/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
