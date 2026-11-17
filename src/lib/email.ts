import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { formatZAR } from './money'
import { orderStatusLabel } from './constants'
import { DEFAULT_SETTINGS, addressLines, getSettings, siteUrl, type StoreSettings } from './settings'
import { db } from './db'
import type { OrderStatus } from '@/generated/prisma/enums'

/**
 * Email is sent over SMTP (works with any provider — Gmail with an app password, Brevo, Mailgun, Amazon SES …).
 * If SMTP is not configured, messages are written to the server log instead so nothing crashes,
 * and the admin dashboard shows a warning.
 */
export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM)
}

let transporter: Transporter | null = null
function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  }
  return transporter
}

export type SendResult = { sent: boolean; error?: string }

export async function sendMail(msg: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<SendResult> {
  if (!emailConfigured()) {
    console.info(`[email:not-configured] To: ${msg.to} | Subject: ${msg.subject}\n${msg.text}\n`)
    return { sent: false, error: 'SMTP is not configured' }
  }
  try {
    await getTransporter().sendMail({ from: process.env.SMTP_FROM, ...msg })
    return { sent: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[email] send failed', { to: msg.to, subject: msg.subject, error })
    return { sent: false, error }
  }
}

function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Shared email frame: black header with the wordmark, ivory body, gold rule. Inline styles for mail clients. */
function layout(s: StoreSettings, heading: string, bodyHtml: string): string {
  const addr = addressLines(s).map(esc).join(', ')
  return `<!doctype html><html lang="en-ZA"><body style="margin:0;padding:0;background:#f5f2ea;font-family:Montserrat,'Helvetica Neue',Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ea;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">
<tr><td style="background:#000000;padding:28px 32px;text-align:center;border-bottom:3px solid #a38336;">
<div style="color:#d9bf7a;font-size:20px;font-weight:800;letter-spacing:5px;">MEN EXCLUSIVE</div>
<div style="color:#b9a36a;font-family:Georgia,serif;font-size:11px;letter-spacing:5px;margin-top:6px;">DRESS TO IMPRESS</div>
</td></tr>
<tr><td style="padding:32px;">
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;line-height:1.3;margin:0 0 16px;">${esc(heading)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e8e2d2;font-size:12px;line-height:1.6;color:#6b6558;">
${esc(s.storeName)}, ${addr}<br>
${s.phone ? `Tel ${esc(s.phone)} &nbsp; ` : ''}${s.email ? `<a href="mailto:${esc(s.email)}" style="color:#7a6124;">${esc(s.email)}</a>` : ''}
</td></tr></table></td></tr></table></body></html>`
}

const p = (html: string) => `<p style="font-size:15px;line-height:1.65;margin:0 0 14px;">${html}</p>`
const button = (href: string, label: string) =>
  `<p style="margin:22px 0;"><a href="${esc(href)}" style="display:inline-block;background:#a38336;color:#000000;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:2px;padding:14px 26px;">${esc(label.toUpperCase())}</a></p>`

type OrderForEmail = {
  number: string
  publicToken: string
  email: string
  firstName: string
  lastName: string
  phone: string
  status: OrderStatus
  fulfilmentType: 'COLLECTION' | 'DELIVERY'
  deliveryMethodName: string
  deliveryNote: string
  shipLine1: string | null
  shipLine2: string | null
  shipSuburb: string | null
  shipCity: string | null
  shipProvince: string | null
  shipPostalCode: string | null
  subtotalCents: number
  discountCents: number
  deliveryCents: number
  totalCents: number
  promoCode: string | null
  customerNote: string
  trackingNumber: string | null
  trackingUrl: string | null
  items: { name: string; sku: string; colour: string; size: string; unitCents: number; quantity: number }[]
}

function orderTable(o: OrderForEmail): string {
  const rows = o.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eee7d6;font-size:14px;line-height:1.5;">${esc(i.name)}<br><span style="color:#6b6558;font-size:12px;">${esc(i.colour)}, size ${esc(i.size)} &nbsp; Ref ${esc(i.sku)}</span></td>
<td style="padding:10px 8px;border-bottom:1px solid #eee7d6;font-size:14px;text-align:center;white-space:nowrap;">× ${i.quantity}</td>
<td style="padding:10px 0;border-bottom:1px solid #eee7d6;font-size:14px;text-align:right;white-space:nowrap;">${formatZAR(i.unitCents * i.quantity)}</td></tr>`,
    )
    .join('')
  const line = (label: string, value: string, bold = false) =>
    `<tr><td colspan="2" style="padding:6px 0;font-size:14px;${bold ? 'font-weight:700;' : ''}">${label}</td><td style="padding:6px 0;font-size:14px;text-align:right;white-space:nowrap;${bold ? 'font-weight:700;' : ''}">${value}</td></tr>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 18px;">${rows}
${line('Subtotal', formatZAR(o.subtotalCents))}
${o.discountCents ? line(`Discount${o.promoCode ? ` (${esc(o.promoCode)})` : ''}`, '-' + formatZAR(o.discountCents)) : ''}
${line(esc(o.deliveryMethodName), o.deliveryCents ? formatZAR(o.deliveryCents) : 'Free')}
${line('Total (ZAR, VAT included where applicable)', formatZAR(o.totalCents), true)}</table>`
}

function fulfilmentBlock(o: OrderForEmail, s: StoreSettings): string {
  if (o.fulfilmentType === 'COLLECTION') {
    return p(`<strong>Collection from our store</strong><br>${addressLines(s).map(esc).join('<br>')}${o.deliveryNote ? `<br><span style="color:#6b6558;">${esc(o.deliveryNote)}</span>` : ''}`)
  }
  const addr = [o.shipLine1, o.shipLine2, o.shipSuburb, o.shipCity, o.shipProvince, o.shipPostalCode].filter(Boolean).map((x) => esc(x)).join('<br>')
  return p(`<strong>Delivery to</strong><br>${esc(o.firstName)} ${esc(o.lastName)}<br>${addr}${o.deliveryNote ? `<br><span style="color:#6b6558;">${esc(o.deliveryNote)}</span>` : ''}`)
}

function orderText(o: OrderForEmail): string {
  return [
    ...o.items.map((i) => `${i.quantity} × ${i.name} (${i.colour}, size ${i.size}, ref ${i.sku}) — ${formatZAR(i.unitCents * i.quantity)}`),
    `Subtotal: ${formatZAR(o.subtotalCents)}`,
    o.discountCents ? `Discount: -${formatZAR(o.discountCents)}` : null,
    `${o.deliveryMethodName}: ${o.deliveryCents ? formatZAR(o.deliveryCents) : 'Free'}`,
    `Total: ${formatZAR(o.totalCents)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function settingsSafe(): Promise<StoreSettings> {
  try {
    return await getSettings()
  } catch {
    return DEFAULT_SETTINGS
  }
}

async function logOrderEmail(orderNumber: string, what: string, result: SendResult) {
  try {
    const order = await db.order.findUnique({ where: { number: orderNumber }, select: { id: true } })
    if (!order) return
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        kind: 'email',
        message: result.sent ? `${what} email sent.` : `${what} email NOT sent (${result.error}).`,
      },
    })
  } catch (err) {
    console.error('[email] could not log order email', err)
  }
}

/** Sent to the customer once payment has been verified. */
export async function sendOrderConfirmation(o: OrderForEmail) {
  const s = await settingsSafe()
  const url = `${siteUrl()}/order/${o.publicToken}`
  const html = layout(
    s,
    `Thank you, ${o.firstName}. Your order is confirmed.`,
    p(`We have received your payment for order <strong>${esc(o.number)}</strong>. Here is a summary for your records.`) +
      orderTable(o) +
      fulfilmentBlock(o, s) +
      p(
        o.fulfilmentType === 'COLLECTION'
          ? 'We will let you know as soon as your order is ready to collect. Please bring this email or your order number with you.'
          : 'We will let you know as soon as your order is on its way.',
      ) +
      button(url, 'View your order') +
      p(`Need help? Reply to this email${s.phone ? ` or call ${esc(s.phone)}` : ''} and quote ${esc(o.number)}.`),
  )
  const text = `Thank you, ${o.firstName}. Your order ${o.number} is confirmed and paid.\n\n${orderText(o)}\n\nView your order: ${url}`
  const result = await sendMail({ to: o.email, subject: `Order ${o.number} confirmed — MEN EXCLUSIVE`, html, text, replyTo: s.email || undefined })
  await logOrderEmail(o.number, 'Order confirmation', result)
}

/** Sent to the store when a paid order arrives. */
export async function sendStoreOrderNotification(o: OrderForEmail) {
  const s = await settingsSafe()
  const to = s.notifyEmail || s.email
  if (!to) return
  const url = `${siteUrl()}/admin/orders/${o.number}`
  const html = layout(
    s,
    `New paid order ${o.number}`,
    p(`<strong>${esc(o.firstName)} ${esc(o.lastName)}</strong><br>${esc(o.email)}<br>${esc(o.phone)}`) +
      orderTable(o) +
      fulfilmentBlock(o, s) +
      (o.customerNote ? p(`<strong>Customer note</strong><br>${esc(o.customerNote)}`) : '') +
      button(url, 'Open order in admin'),
  )
  const text = `New paid order ${o.number} from ${o.firstName} ${o.lastName} (${o.email}, ${o.phone}).\n\n${orderText(o)}\n\n${url}`
  const result = await sendMail({ to, subject: `New order ${o.number} — ${formatZAR(o.totalCents)}`, html, text, replyTo: o.email })
  await logOrderEmail(o.number, 'Store notification', result)
}

const STATUS_COPY: Partial<Record<OrderStatus, (o: OrderForEmail) => { heading: string; body: string }>> = {
  PROCESSING: () => ({ heading: 'We are preparing your order', body: 'Your order is being prepared. We will be in touch again when it is ready.' }),
  READY_FOR_COLLECTION: () => ({
    heading: 'Your order is ready for collection',
    body: 'Your order is ready and waiting for you at our store. Please bring your order number and proof of identity.',
  }),
  DISPATCHED: (o) => ({
    heading: 'Your order is on its way',
    body:
      'Your order has been dispatched.' +
      (o.trackingNumber ? ` Tracking number: <strong>${esc(o.trackingNumber)}</strong>.` : '') +
      (o.trackingUrl ? ` <a href="${esc(o.trackingUrl)}" style="color:#7a6124;">Track your parcel</a>.` : ''),
  }),
  DELIVERED: (o) =>
    o.fulfilmentType === 'COLLECTION'
      ? { heading: 'Thank you for collecting your order', body: 'We hope you enjoy your purchase. If anything is not right, please contact us and we will assist.' }
      : { heading: 'Your order has been delivered', body: 'We hope you enjoy your purchase. If anything is not right, please contact us and we will assist.' },
  CANCELLED: () => ({ heading: 'Your order has been cancelled', body: 'This order has been cancelled. If you have already paid and have not been refunded, please contact us.' }),
  REFUNDED: () => ({
    heading: 'Your order has been refunded',
    body: 'A refund has been issued to your original payment method. Banks usually take a few business days to show it on your statement.',
  }),
}

export async function sendOrderStatusEmail(o: OrderForEmail) {
  const copy = STATUS_COPY[o.status]?.(o)
  if (!copy) return
  const s = await settingsSafe()
  const url = `${siteUrl()}/order/${o.publicToken}`
  const html = layout(
    s,
    copy.heading,
    p(`Order <strong>${esc(o.number)}</strong>`) + p(copy.body) + (o.status === 'READY_FOR_COLLECTION' ? fulfilmentBlock(o, s) : '') + button(url, 'View your order'),
  )
  const text = `${copy.heading}\nOrder ${o.number}\n\n${copy.body.replace(/<[^>]+>/g, '')}\n\n${url}`
  const result = await sendMail({
    to: o.email,
    subject: `Order ${o.number}: ${orderStatusLabel(o.status, o.fulfilmentType)} — MEN EXCLUSIVE`,
    html,
    text,
    replyTo: s.email || undefined,
  })
  await logOrderEmail(o.number, `"${orderStatusLabel(o.status, o.fulfilmentType)}" update`, result)
}

export async function sendPasswordReset(to: string, firstName: string, resetUrl: string) {
  const s = await settingsSafe()
  const html = layout(
    s,
    'Reset your password',
    p(`Hello ${esc(firstName)}, we received a request to reset the password for your MEN EXCLUSIVE account.`) +
      button(resetUrl, 'Choose a new password') +
      p('This link works once and expires in 60 minutes. If you did not ask for it, you can ignore this email and your password will stay the same.'),
  )
  const text = `Reset your MEN EXCLUSIVE password using this link (valid for 60 minutes, single use):\n${resetUrl}\n\nIf you did not ask for this, ignore this email.`
  return sendMail({ to, subject: 'Reset your MEN EXCLUSIVE password', html, text })
}

export async function sendAppointmentEmails(a: {
  name: string
  phone: string
  email: string | null
  purpose: string
  occasion: string | null
  preferredDate: string
  preferredTime: string
  notes: string
}) {
  const s = await settingsSafe()
  const details = `<strong>Purpose:</strong> ${esc(a.purpose)}<br>${a.occasion ? `<strong>Occasion:</strong> ${esc(a.occasion)}<br>` : ''}<strong>Preferred date:</strong> ${esc(a.preferredDate)}<br><strong>Preferred time:</strong> ${esc(a.preferredTime)}${a.notes ? `<br><strong>Notes:</strong> ${esc(a.notes)}` : ''}`
  const to = s.notifyEmail || s.email
  if (to) {
    await sendMail({
      to,
      subject: `Appointment request: ${a.name} — ${a.purpose}`,
      html: layout(s, 'New appointment request', p(`<strong>${esc(a.name)}</strong><br>${esc(a.phone)}${a.email ? `<br>${esc(a.email)}` : ''}`) + p(details) + button(`${siteUrl()}/admin/appointments`, 'Open appointments')),
      text: `Appointment request from ${a.name} (${a.phone}${a.email ? ', ' + a.email : ''})\nPurpose: ${a.purpose}\nOccasion: ${a.occasion ?? '-'}\nPreferred: ${a.preferredDate} ${a.preferredTime}\nNotes: ${a.notes || '-'}`,
      replyTo: a.email || undefined,
    })
  }
  if (a.email) {
    await sendMail({
      to: a.email,
      subject: 'We have received your appointment request — MEN EXCLUSIVE',
      html: layout(
        s,
        `Thank you, ${a.name}. We have your request.`,
        p('This is a request, not a confirmed booking. Your appointment is confirmed only once our team replies to you with a time.') + p(details),
      ),
      text: `Thank you, ${a.name}. We have received your appointment request.\nThis is a request, not a confirmed booking. Your appointment is confirmed only once our team replies.\n\nPurpose: ${a.purpose}\nPreferred: ${a.preferredDate} ${a.preferredTime}`,
      replyTo: s.email || undefined,
    })
  }
}

export async function sendEnquiryEmail(e: { name: string; email: string | null; phone: string | null; topic: string; message: string }) {
  const s = await settingsSafe()
  const to = s.notifyEmail || s.email
  if (!to) return
  await sendMail({
    to,
    subject: `Website enquiry: ${e.topic} — ${e.name}`,
    html: layout(
      s,
      'New website enquiry',
      p(`<strong>${esc(e.name)}</strong>${e.email ? `<br>${esc(e.email)}` : ''}${e.phone ? `<br>${esc(e.phone)}` : ''}`) +
        p(`<strong>${esc(e.topic)}</strong><br>${esc(e.message).replace(/\n/g, '<br>')}`) +
        button(`${siteUrl()}/admin/enquiries`, 'Open enquiries'),
    ),
    text: `Enquiry from ${e.name} (${e.email ?? '-'}, ${e.phone ?? '-'})\nTopic: ${e.topic}\n\n${e.message}`,
    replyTo: e.email || undefined,
  })
}

/** Sent to the store when a payment needs a person to look at it (amount mismatch, late payment, refund failure). */
export async function sendPaymentAlert(orderNumber: string, problem: string) {
  const s = await settingsSafe()
  const to = s.notifyEmail || s.email
  if (!to) return
  await sendMail({
    to,
    subject: `Action needed on order ${orderNumber}`,
    html: layout(s, `Order ${orderNumber} needs your attention`, p(esc(problem)) + button(`${siteUrl()}/admin/orders/${orderNumber}`, 'Open order in admin')),
    text: `Order ${orderNumber} needs your attention:\n${problem}\n${siteUrl()}/admin/orders/${orderNumber}`,
  })
}

export type { OrderForEmail }
