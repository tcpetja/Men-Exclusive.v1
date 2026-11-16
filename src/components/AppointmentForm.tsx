'use client'

import { useActionState } from 'react'
import { appointmentAction, type AppointmentState } from '@/app/actions/public'
import { APPOINTMENT_PURPOSES } from '@/lib/constants'
import { Field, FormMessage, Honeypot, SubmitButton } from './forms'
import { IconWhatsApp } from './icons'

const OCCASIONS = ['Corporate and business', 'Matric dance', 'Graduation', 'Wedding', 'Formal or black tie', 'Business travel', 'Special occasion', 'No particular occasion']
const TIMES = ['Morning', 'Midday', 'Afternoon', 'Any time']

export function AppointmentForm({ defaults }: { defaults?: { name?: string; phone?: string; email?: string; purpose?: string } }) {
  const [state, action] = useActionState<AppointmentState, FormData>(appointmentAction, null)
  const today = new Date().toISOString().slice(0, 10)

  if (state?.ok) {
    return (
      <div className="panel stack" role="status">
        <h2 className="display-sm">We have your request</h2>
        <p className="soft">
          This is a request, not a confirmed booking. Your appointment is confirmed once our team replies to you with a time.
        </p>
        {state.whatsappUrl && (
          <>
            <p className="soft">Want a quicker reply? Send the same details on WhatsApp.</p>
            <div>
              <a href={state.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                <IconWhatsApp />
                Send on WhatsApp too
              </a>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <form action={action} className="form" noValidate>
      <FormMessage state={state} />
      <div className="form-row">
        <Field label="Your name" name="name" required state={state} autoComplete="name" defaultValue={defaults?.name} />
        <Field label="Phone number" name="phone" type="tel" inputMode="tel" required state={state} autoComplete="tel" defaultValue={defaults?.phone} hint="We will call or WhatsApp you on this number." />
      </div>
      <Field label="Email address" name="email" type="email" inputMode="email" state={state} autoComplete="email" defaultValue={defaults?.email} />
      <div className="form-row">
        <Field label="What is the appointment for?" name="purpose" required state={state} options={APPOINTMENT_PURPOSES} defaultValue={defaults?.purpose} />
        <Field label="Occasion" name="occasion" state={state} options={OCCASIONS} emptyOption="Choose an occasion" />
      </div>
      <div className="form-row">
        <Field label="Preferred date" name="preferredDate" type="date" required state={state} min={today} />
        <Field label="Preferred time" name="preferredTime" required state={state} options={TIMES} />
      </div>
      <Field label="Anything we should know?" name="notes" textarea state={state} maxLength={1000} placeholder="For example your usual size, the date of the event or how many people are coming." />
      <Honeypot />
      <p className="muted" style={{ fontSize: '0.84rem' }}>
        Sending this form requests an appointment. It is confirmed only once the store replies to you.
      </p>
      <div>
        <SubmitButton pendingLabel="Sending request…">Request appointment</SubmitButton>
      </div>
    </form>
  )
}
