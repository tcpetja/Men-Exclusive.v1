import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetForm } from '@/components/account/AccountForms'

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false }, referrer: 'no-referrer' }

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <div className="wrap section-tight">
      <div className="auth">
        <h1 className="display">Choose a new password</h1>
        {token ? (
          <ResetForm token={token} />
        ) : (
          <p className="notice notice-error">
            This link is incomplete.{' '}
            <Link href="/account/forgot" className="link">
              Request a new reset link
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  )
}
