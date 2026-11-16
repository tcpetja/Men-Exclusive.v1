import type { Metadata } from 'next'
import { PasswordForm, ProfileForm } from '@/components/account/AccountForms'
import { requireUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Your details', robots: { index: false } }

export default async function DetailsPage() {
  const user = await requireUser('/account/details')
  return (
    <div className="checkout">
      <section className="stack">
        <h2 className="display-sm">Your details</h2>
        <ProfileForm user={user} />
      </section>
      <section className="panel stack">
        <h2 className="step-title">Password</h2>
        <PasswordForm />
      </section>
    </div>
  )
}
