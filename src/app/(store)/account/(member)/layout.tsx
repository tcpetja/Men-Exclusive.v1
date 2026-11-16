import Link from 'next/link'
import type { ReactNode } from 'react'
import { logoutAction } from '@/app/actions/account'
import { AccountNav } from '@/components/account/AccountNav'
import { requireUser } from '@/lib/auth'

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  return (
    <div className="wrap">
      <header className="pagehead" style={{ paddingBottom: 20 }}>
        <h1 className="display">Hello, {user.firstName}</h1>
        {user.role === 'ADMIN' && (
          <p>
            <Link href="/admin" className="link">
              Go to store admin
            </Link>
          </p>
        )}
      </header>
      <div className="account" style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <div className="account-nav">
          <AccountNav />
          <form action={logoutAction} style={{ marginLeft: 'auto' }}>
            <button type="submit">Sign out</button>
          </form>
        </div>
        {children}
      </div>
    </div>
  )
}
