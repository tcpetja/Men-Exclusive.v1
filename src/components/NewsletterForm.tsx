'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { subscribeAction } from '@/app/actions/public'

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeAction, null)
  if (state?.ok) return <p className="gold">{state.message}</p>
  return (
    <form action={action} className="stack" style={{ gap: 10 }}>
      <div className="newsletter">
        <label htmlFor="nl-email" className="sr-only">
          Email address
        </label>
        <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder="Email address" />
        <input name="company" className="hp" tabIndex={-1} autoComplete="off" aria-hidden />
        <button type="submit" disabled={pending}>
          {pending ? 'Joining…' : 'Subscribe'}
        </button>
      </div>
      {state?.message && <p className="error">{state.message}</p>}
      <p className="muted" style={{ fontSize: '0.76rem' }}>
        By subscribing you agree to receive news and offers from us by email. Unsubscribe at any time. See our{' '}
        <Link href="/policies/privacy" className="link">
          privacy policy
        </Link>
        .
      </p>
    </form>
  )
}
