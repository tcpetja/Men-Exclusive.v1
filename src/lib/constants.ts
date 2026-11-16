import type { OrderStatus, RequestStatus } from '@/generated/prisma/enums'

/** Broad colour groups used by the shop's colour filter. */
export const COLOUR_FAMILIES = [
  { id: 'black', label: 'Black', hex: '#111111' },
  { id: 'grey', label: 'Grey & stone', hex: '#9a958c' },
  { id: 'blue', label: 'Navy & blue', hex: '#27375f' },
  { id: 'green', label: 'Green', hex: '#3c5a4c' },
  { id: 'brown', label: 'Brown & tan', hex: '#8a5a40' },
  { id: 'ivory', label: 'Ivory & cream', hex: '#efe6d6' },
  { id: 'pink', label: 'Pink & lilac', hex: '#e2b9bd' },
  { id: 'red', label: 'Rust & burgundy', hex: '#a5482f' },
  { id: 'yellow', label: 'Yellow', hex: '#d9cf5c' },
] as const

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Pending payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  READY_FOR_COLLECTION: 'Ready for collection',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

/** Collection orders finish as "Collected"; delivery orders as "Delivered". */
export function orderStatusLabel(status: OrderStatus, fulfilment?: 'COLLECTION' | 'DELIVERY') {
  if (status === 'DELIVERED' && fulfilment === 'COLLECTION') return 'Collected'
  return ORDER_STATUS_LABEL[status]
}

/**
 * Which statuses the store can move an order to from each status.
 * Paid orders are cancelled by refunding them (see the refund actions in the admin order page).
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CANCELLED'],
  PAID: ['PROCESSING', 'READY_FOR_COLLECTION', 'DISPATCHED'],
  PROCESSING: ['READY_FOR_COLLECTION', 'DISPATCHED', 'DELIVERED'],
  READY_FOR_COLLECTION: ['DELIVERED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
}

export function allowedTransitions(status: OrderStatus, fulfilment: 'COLLECTION' | 'DELIVERY'): OrderStatus[] {
  return ORDER_TRANSITIONS[status].filter((s) =>
    fulfilment === 'COLLECTION' ? s !== 'DISPATCHED' : s !== 'READY_FOR_COLLECTION',
  )
}

export const REFUNDABLE_STATUSES: OrderStatus[] = ['PAID', 'PROCESSING', 'READY_FOR_COLLECTION', 'DISPATCHED', 'DELIVERED']

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: 'New',
  CONFIRMED: 'Confirmed',
  DONE: 'Completed',
  DECLINED: 'Declined',
}

export const APPOINTMENT_PURPOSES = [
  'Suit selection',
  'Personal styling',
  'Fitting',
  'Matric dance consultation',
  'Wedding consultation',
  'Graduation consultation',
  'Corporate styling',
  'Alteration assessment',
] as const

export const ENQUIRY_TOPICS = [
  'Product enquiry',
  'Size assistance',
  'Fittings and alterations',
  'Wedding or group enquiry',
  'Corporate wardrobe',
  'Order assistance',
  'Special request',
  'Something else',
] as const

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
] as const

export const POLICY_PAGES = [
  { slug: 'delivery', title: 'Delivery and collection' },
  { slug: 'returns-exchanges', title: 'Returns and exchanges' },
  { slug: 'refunds', title: 'Refunds' },
  { slug: 'privacy', title: 'Privacy policy' },
  { slug: 'terms', title: 'Terms and conditions' },
  { slug: 'cookies', title: 'Cookie policy' },
] as const

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop suits' },
  { href: '/occasions', label: 'Shop by occasion' },
  { href: '/fabrics-craftsmanship', label: 'Fabrics & craftsmanship' },
  { href: '/our-story', label: 'Our story' },
  { href: '/fittings-alterations', label: 'Fittings & alterations' },
  { href: '/contact', label: 'Contact' },
] as const

export const SESSION_COOKIE = 'me_session'
export const CONSENT_COOKIE = 'me_consent'
