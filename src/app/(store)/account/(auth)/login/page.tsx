import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/account/AccountForms'
import { getCurrentUser, safeNext } from '@/lib/auth'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(safeNext(next, user.role === 'ADMIN' ? '/admin' : '/account'))
  const registerHref = next ? `/account/register?next=${encodeURIComponent(next)}` : '/account/register'
  return (
    <div className="wrap section-tight">
      <div className="auth">
        <div className="stack" style={{ gap: 10 }}>
          <h1 className="display">Sign in</h1>
          <p className="soft">See your orders and check out faster.</p>
        </div>
        <LoginForm next={next} />
        <div className="panel stack">
          <h2 className="step-title">New here?</h2>
          <p className="soft">Create an account to keep your details and order history in one place. You can also check out as a guest.</p>
          <Link href={registerHref} className="btn btn-line btn-block">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}
