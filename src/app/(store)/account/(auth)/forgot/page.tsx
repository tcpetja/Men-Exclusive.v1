import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotForm } from '@/components/account/AccountForms'

export const metadata: Metadata = { title: 'Reset your password', robots: { index: false } }

export default function ForgotPage() {
  return (
    <div className="wrap section-tight">
      <div className="auth">
        <div className="stack" style={{ gap: 10 }}>
          <h1 className="display">Reset your password</h1>
          <p className="soft">Enter the email address you registered with and we will send you a link to choose a new password.</p>
        </div>
        <ForgotForm />
        <p className="soft center">
          <Link href="/account/login" className="link">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
