import { orderStatusLabel } from '@/lib/constants'
import type { OrderStatus } from '@/generated/prisma/enums'

export function StatusPill({ status, fulfilment }: { status: OrderStatus; fulfilment: 'COLLECTION' | 'DELIVERY' }) {
  const tone = status === 'CANCELLED' || status === 'REFUNDED' ? 'a-pill-bad' : status === 'PENDING_PAYMENT' ? 'a-pill-warn' : 'a-pill-ok'
  return <span className={`a-pill ${tone}`}>{orderStatusLabel(status, fulfilment)}</span>
}

const dateTime = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' })
const dateOnly = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'Africa/Johannesburg' })

export const fmtDateTime = (d: Date) => dateTime.format(d)
export const fmtDate = (d: Date) => dateOnly.format(d)
