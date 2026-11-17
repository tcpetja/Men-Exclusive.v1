'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import {
  changePasswordAction,
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
  saveAddressAction,
  updateProfileAction,
} from '@/app/actions/account'
import { SA_PROVINCES } from '@/lib/constants'
import type { ActionState } from '@/lib/validation'
import { Field, FormMessage, SubmitButton } from '../forms'

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, null)
  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email address" name="email" type="email" inputMode="email" required state={state} autoComplete="email" />
      <Field label="Password" name="password" type="password" required state={state} autoComplete="current-password" />
      <SubmitButton pendingLabel="Signing in…" className="btn btn-gold btn-block">
        Sign in
      </SubmitButton>
      <p className="soft" style={{ fontSize: '0.9rem' }}>
        <Link href="/account/forgot" className="link">
          Forgot your password?
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm({ next, orderToken, email }: { next?: string; orderToken?: string; email?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(registerAction, null)
  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      {next && <input type="hidden" name="next" value={next} />}
      {orderToken && <input type="hidden" name="order" value={orderToken} />}
      <div className="form-row">
        <Field label="First name" name="firstName" required state={state} autoComplete="given-name" />
        <Field label="Surname" name="lastName" required state={state} autoComplete="family-name" />
      </div>
      <Field label="Email address" name="email" type="email" inputMode="email" required state={state} autoComplete="email" defaultValue={email} />
      <Field label="Phone number" name="phone" type="tel" inputMode="tel" state={state} autoComplete="tel" />
      <Field label="Password" name="password" type="password" required state={state} autoComplete="new-password" hint="At least 10 characters. A short sentence is easy to remember and hard to guess." />
      <label className="check">
        <input type="checkbox" name="marketingOptIn" />
        <span>Email me news and offers from MEN EXCLUSIVE. You can unsubscribe at any time.</span>
      </label>
      <p className="muted" style={{ fontSize: '0.82rem' }}>
        By creating an account you agree to our{' '}
        <Link href="/policies/terms" className="link">
          terms
        </Link>{' '}
        and{' '}
        <Link href="/policies/privacy" className="link">
          privacy policy
        </Link>
        .
      </p>
      <SubmitButton pendingLabel="Creating account…" className="btn btn-gold btn-block">
        Create account
      </SubmitButton>
    </form>
  )
}

export function ForgotForm() {
  const [state, action] = useActionState<ActionState, FormData>(forgotPasswordAction, null)
  if (state?.ok) return <FormMessage state={state} />
  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <Field label="Email address" name="email" type="email" inputMode="email" required state={state} autoComplete="email" />
      <SubmitButton pendingLabel="Sending link…" className="btn btn-gold btn-block">
        Send reset link
      </SubmitButton>
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPasswordAction, null)
  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <Field label="New password" name="password" type="password" required state={state} autoComplete="new-password" hint="At least 10 characters." />
      <Field label="Type it again" name="confirm" type="password" required state={state} autoComplete="new-password" />
      <SubmitButton pendingLabel="Saving…" className="btn btn-gold btn-block">
        Save new password
      </SubmitButton>
    </form>
  )
}

export function ProfileForm({ user }: { user: { firstName: string; lastName: string; phone: string | null; email: string; marketingOptIn: boolean } }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfileAction, null)
  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <div className="form-row">
        <Field label="First name" name="firstName" required state={state} autoComplete="given-name" defaultValue={user.firstName} />
        <Field label="Surname" name="lastName" required state={state} autoComplete="family-name" defaultValue={user.lastName} />
      </div>
      <div className="field">
        <span className="field-label">Email address</span>
        <p>{user.email}</p>
        <span className="hint">Contact us if you need to change the email address on your account.</span>
      </div>
      <Field label="Phone number" name="phone" type="tel" inputMode="tel" state={state} autoComplete="tel" defaultValue={user.phone ?? ''} />
      <label className="check">
        <input type="checkbox" name="marketingOptIn" defaultChecked={user.marketingOptIn} />
        <span>Email me news and offers from MEN EXCLUSIVE.</span>
      </label>
      <div>
        <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
      </div>
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, null)
  return (
    <form action={action} className="form" noValidate key={state?.ok ? 'done' : 'edit'}>
      <FormMessage state={state} />
      <Field label="Current password" name="currentPassword" type="password" required state={state} autoComplete="current-password" />
      <Field label="New password" name="newPassword" type="password" required state={state} autoComplete="new-password" hint="At least 10 characters." />
      <div>
        <SubmitButton pendingLabel="Saving…" className="btn btn-line">
          Change password
        </SubmitButton>
      </div>
    </form>
  )
}

export function AddressForm({ defaults }: { defaults: { recipient: string; phone: string } }) {
  const [state, action] = useActionState<ActionState, FormData>(saveAddressAction, null)
  return (
    <form action={action} className="form" noValidate key={state?.ok ? Date.now() : 'edit'}>
      <FormMessage state={state} />
      <div className="form-row">
        <Field label="Recipient" name="recipient" required state={state} autoComplete="name" defaultValue={defaults.recipient} />
        <Field label="Phone number" name="phone" type="tel" inputMode="tel" required state={state} autoComplete="tel" defaultValue={defaults.phone} />
      </div>
      <Field label="Street address" name="line1" required state={state} autoComplete="address-line1" />
      <Field label="Complex, building or unit" name="line2" state={state} autoComplete="address-line2" />
      <div className="form-row">
        <Field label="Suburb" name="suburb" required state={state} autoComplete="address-level3" />
        <Field label="City or town" name="city" required state={state} autoComplete="address-level2" />
      </div>
      <div className="form-row">
        <Field label="Province" name="province" required state={state} options={SA_PROVINCES} defaultValue="Gauteng" />
        <Field label="Postal code" name="postalCode" required state={state} inputMode="numeric" maxLength={4} autoComplete="postal-code" />
      </div>
      <div>
        <SubmitButton pendingLabel="Saving…">Save address</SubmitButton>
      </div>
    </form>
  )
}
