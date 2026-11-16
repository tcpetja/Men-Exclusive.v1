'use server'

import { after } from 'next/server'
import { db } from '@/lib/db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { appointmentSchema, emailField, enquirySchema, fieldErrors, type ActionState } from '@/lib/validation'
import { sendAppointmentEmails, sendEnquiryEmail } from '@/lib/email'
import { getSettings } from '@/lib/settings'
import { waLink, waMessages } from '@/lib/whatsapp'

function values(form: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string') out[k] = v
  return out
}

/** Bots fill in every field, including the one hidden from people. */
function isBot(form: FormData) {
  return Boolean(form.get('company'))
}

export async function subscribeAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (isBot(form)) return { ok: true, message: 'Thank you. You are on the list.' }
  if (!(await rateLimit(`subscribe:${await clientIp()}`, 6, 600))) return { message: 'Too many attempts. Please try again later.' }
  const parsed = emailField.safeParse(form.get('email'))
  if (!parsed.success) return { message: 'Enter a valid email address.' }
  await db.subscriber.upsert({ where: { email: parsed.data }, create: { email: parsed.data }, update: {} })
  return { ok: true, message: 'Thank you. You are on the list.' }
}

export type AppointmentState = ActionState & { whatsappUrl?: string }

export async function appointmentAction(_prev: AppointmentState, form: FormData): Promise<AppointmentState> {
  const v = values(form)
  if (isBot(form)) return { ok: true }
  if (!(await rateLimit(`appointment:${await clientIp()}`, 5, 900))) return { message: 'Too many requests. Please try again later, or contact us on WhatsApp.', values: v }

  const parsed = appointmentSchema.safeParse(v)
  if (!parsed.success) return { message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error), values: v }
  const d = parsed.data
  const record = {
    name: d.name,
    phone: d.phone,
    email: d.email || null,
    purpose: d.purpose,
    occasion: d.occasion || null,
    preferredDate: d.preferredDate,
    preferredTime: d.preferredTime,
    notes: d.notes,
  }
  await db.appointment.create({ data: record })
  after(() => sendAppointmentEmails(record))

  const { whatsapp } = await getSettings()
  return {
    ok: true,
    whatsappUrl: whatsapp
      ? waLink(whatsapp, waMessages.appointment({ name: d.name, purpose: d.purpose, occasion: d.occasion, date: d.preferredDate, time: d.preferredTime, notes: d.notes }))
      : undefined,
  }
}

export async function enquiryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const v = values(form)
  if (isBot(form)) return { ok: true }
  if (!(await rateLimit(`enquiry:${await clientIp()}`, 5, 900))) return { message: 'Too many messages. Please try again later, or contact us on WhatsApp.', values: v }

  const parsed = enquirySchema.safeParse(v)
  if (!parsed.success) return { message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error), values: v }
  const d = parsed.data
  const record = { name: d.name, email: d.email || null, phone: d.phone || null, topic: d.topic, message: d.message }
  await db.enquiry.create({ data: record })
  after(() => sendEnquiryEmail(record))
  return { ok: true }
}
