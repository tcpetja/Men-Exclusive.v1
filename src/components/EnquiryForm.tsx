'use client'

import { useActionState } from 'react'
import { enquiryAction } from '@/app/actions/public'
import { ENQUIRY_TOPICS } from '@/lib/constants'
import type { ActionState } from '@/lib/validation'
import { Field, FormMessage, Honeypot, SubmitButton } from './forms'

export function EnquiryForm({ defaults }: { defaults?: { name?: string; phone?: string; email?: string } }) {
  const [state, action] = useActionState<ActionState, FormData>(enquiryAction, null)

  if (state?.ok) {
    return (
      <div className="panel stack" role="status">
        <h2 className="display-sm">Message sent</h2>
        <p className="soft">Thank you. We will reply to you as soon as we can.</p>
      </div>
    )
  }

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <Field label="Your name" name="name" required state={state} autoComplete="name" defaultValue={defaults?.name} />
      <div className="form-row">
        <Field label="Email address" name="email" type="email" inputMode="email" state={state} autoComplete="email" defaultValue={defaults?.email} hint="Give us an email address or a phone number." />
        <Field label="Phone number" name="phone" type="tel" inputMode="tel" state={state} autoComplete="tel" defaultValue={defaults?.phone} />
      </div>
      <Field label="What is your message about?" name="topic" required state={state} options={ENQUIRY_TOPICS} />
      <Field label="Your message" name="message" textarea rows={6} required state={state} maxLength={2000} />
      <Honeypot />
      <div>
        <SubmitButton pendingLabel="Sending…">Send message</SubmitButton>
      </div>
    </form>
  )
}
