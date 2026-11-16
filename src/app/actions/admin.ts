'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { COLOUR_FAMILIES } from '@/lib/constants'
import { CONTENT_BY_KEY } from '@/content/defaults'
import { db } from '@/lib/db'
import { loadEditorProduct, type EditorProduct } from '@/lib/admin-product'
import { emailConfigured, sendOrderConfirmation } from '@/lib/email'
import { formatZAR, parseRandsToCents } from '@/lib/money'
import { applyRefund, canRefund, changeOrderStatus, notifyStatus } from '@/lib/orders'
import { DEFAULT_SETTINGS, saveSettings, type StoreSettings } from '@/lib/settings'
import { fieldErrors, slugField, slugify, type ActionState, type FieldErrors } from '@/lib/validation'
import { refundCheckout, YocoError } from '@/lib/yoco'
import type { OrderStatus, RequestStatus } from '@/generated/prisma/enums'

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const bool = (form: FormData, key: string) => form.get(key) === 'on' || form.get(key) === 'true'
const int = (form: FormData, key: string, fallback = 0) => {
  const n = parseInt(str(form, key), 10)
  return Number.isFinite(n) ? n : fallback
}
const refresh = () => revalidatePath('/', 'layout')
const saved = (message = 'Saved.'): ActionState => ({ ok: true, message })
const emailed = () => (emailConfigured() ? 'The customer has been emailed.' : 'Email is not connected yet, so the customer was NOT emailed. Let them know yourself.')
const failed = (message: string, fields?: FieldErrors): ActionState => ({ ok: false, message, fields })

// ───────────────────────── Store settings ─────────────────────────

export async function saveSettingsAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const patch: Record<string, unknown> = {}
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof StoreSettings)[]) {
    if (!form.has(key)) continue
    if (typeof DEFAULT_SETTINGS[key] === 'number') {
      const n = int(form, key, DEFAULT_SETTINGS[key] as number)
      patch[key] = key === 'reservationMinutes' ? Math.min(24 * 60, Math.max(10, n)) : n
    } else {
      patch[key] = String(form.get(key) ?? '').replace(/\r/g, '').trim().slice(0, 2000)
    }
  }
  const fields: FieldErrors = {}
  for (const key of ['instagram', 'facebook', 'tiktok', 'mapUrl'] as const) {
    const v = patch[key]
    if (typeof v === 'string' && v && !/^https:\/\//.test(v)) fields[key] = 'Enter the full address, starting with https://'
  }
  if (typeof patch.gaMeasurementId === 'string' && patch.gaMeasurementId && !/^G-[A-Z0-9]+$/.test(patch.gaMeasurementId)) {
    fields.gaMeasurementId = 'A Google Analytics 4 ID looks like G-XXXXXXXXXX.'
  }
  if (typeof patch.whatsapp === 'string' && patch.whatsapp && patch.whatsapp.replace(/\D/g, '').length < 10) fields.whatsapp = 'Enter the full number, for example +27 63 051 2118.'
  if (Object.keys(fields).length) return failed('Please check the highlighted fields.', fields)
  await saveSettings(patch as Partial<StoreSettings>)
  refresh()
  return saved('Store settings saved.')
}

// ───────────────────────── Website content ─────────────────────────

export async function saveContentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const key = str(form, 'key')
  if (!CONTENT_BY_KEY[key]) return failed('Unknown content block.')
  const body = String(form.get('body') ?? '').replace(/\r/g, '').trim().slice(0, 30_000)
  if (form.get('intent') === 'reset' || body === CONTENT_BY_KEY[key].body.trim()) {
    await db.contentBlock.deleteMany({ where: { key } })
    refresh()
    return saved('Restored to the original text.')
  }
  await db.contentBlock.upsert({ where: { key }, create: { key, body }, update: { body } })
  refresh()
  return saved('Saved. The website now shows your text.')
}

// ───────────────────────── Categories and occasions ─────────────────────────

export async function saveCategoryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(form, 'id')
  const name = str(form, 'name')
  if (!name) return failed('Enter a name.', { name: 'Enter a name.' })
  const slug = slugField.safeParse(str(form, 'slug') || slugify(name))
  if (!slug.success) return failed('Check the web address.', { slug: slug.error.issues[0].message })
  const clash = await db.category.findFirst({ where: { slug: slug.data, NOT: id ? { id } : undefined } })
  if (clash) return failed('Another suit type already uses that web address.', { slug: 'Already in use.' })
  const data = { name, slug: slug.data, description: str(form, 'description') || null, sortOrder: int(form, 'sortOrder') }
  if (id) await db.category.update({ where: { id }, data })
  else await db.category.create({ data })
  refresh()
  return saved()
}

export async function deleteCategoryAction(form: FormData) {
  await requireAdmin()
  await db.category.deleteMany({ where: { id: str(form, 'id') } })
  refresh()
}

export async function saveOccasionAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(form, 'id')
  const name = str(form, 'name')
  const tagline = str(form, 'tagline')
  const intro = str(form, 'intro')
  const fields: FieldErrors = {}
  if (!name) fields.name = 'Enter a name.'
  if (!tagline) fields.tagline = 'Enter a short line.'
  if (!intro) fields.intro = 'Enter an introduction.'
  if (Object.keys(fields).length) return failed('Please check the highlighted fields.', fields)
  await db.occasion.update({
    where: { id },
    data: {
      name,
      tagline,
      intro,
      stylingNotes: String(form.get('stylingNotes') ?? '').replace(/\r/g, '').trim(),
      seoTitle: str(form, 'seoTitle') || null,
      seoDesc: str(form, 'seoDesc') || null,
      sortOrder: int(form, 'sortOrder'),
    },
  })
  refresh()
  return saved()
}

// ───────────────────────── Delivery and collection ─────────────────────────

export async function saveDeliveryAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(form, 'id')
  const name = str(form, 'name')
  const fee = parseRandsToCents(str(form, 'fee') || '0')
  const freeOverRaw = str(form, 'freeOver')
  const freeOver = freeOverRaw ? parseRandsToCents(freeOverRaw) : null
  const fields: FieldErrors = {}
  if (!name) fields.name = 'Enter the name customers will see.'
  if (fee == null) fields.fee = 'Enter an amount in Rand, for example 120.'
  if (freeOverRaw && freeOver == null) fields.freeOver = 'Enter an amount in Rand, or leave this empty.'
  if (Object.keys(fields).length) return failed('Please check the highlighted fields.', fields)
  const data = {
    name,
    type: str(form, 'type') === 'DELIVERY' ? ('DELIVERY' as const) : ('COLLECTION' as const),
    feeCents: fee!,
    freeOverCents: freeOver,
    description: str(form, 'description').slice(0, 300),
    isActive: bool(form, 'isActive'),
    sortOrder: int(form, 'sortOrder'),
  }
  if (id) await db.deliveryMethod.update({ where: { id }, data })
  else await db.deliveryMethod.create({ data })
  refresh()
  return saved(data.isActive ? 'Saved. Customers can choose this option at checkout.' : 'Saved. This option is switched off, so customers cannot see it yet.')
}

export async function deleteDeliveryAction(form: FormData) {
  await requireAdmin()
  await db.deliveryMethod.deleteMany({ where: { id: str(form, 'id') } })
  refresh()
}

// ───────────────────────── Promo codes ─────────────────────────

export async function savePromoAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(form, 'id')
  const code = str(form, 'code').toUpperCase().replace(/\s+/g, '')
  const type = str(form, 'type') === 'FIXED' ? ('FIXED' as const) : ('PERCENT' as const)
  const fields: FieldErrors = {}
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) fields.code = 'Use 3 to 30 letters and numbers, with no spaces.'
  let value = 0
  if (type === 'PERCENT') {
    value = int(form, 'value', -1)
    if (value < 1 || value > 100) fields.value = 'Enter a percentage from 1 to 100.'
  } else {
    const cents = parseRandsToCents(str(form, 'value'))
    if (cents == null || cents < 100) fields.value = 'Enter an amount in Rand.'
    else value = cents
  }
  const minSpend = parseRandsToCents(str(form, 'minSpend') || '0')
  if (minSpend == null) fields.minSpend = 'Enter an amount in Rand, or leave this empty.'
  const date = (key: string) => {
    const v = str(form, key)
    if (!v) return null
    const d = new Date(v + (key === 'endsAt' ? 'T23:59:59+02:00' : 'T00:00:00+02:00'))
    if (Number.isNaN(d.getTime())) fields[key] = 'Enter a valid date.'
    return d
  }
  const startsAt = date('startsAt')
  const endsAt = date('endsAt')
  const maxUsesRaw = str(form, 'maxUses')
  const maxUses = maxUsesRaw ? int(form, 'maxUses', -1) : null
  if (maxUses != null && maxUses < 1) fields.maxUses = 'Enter a whole number, or leave this empty for no limit.'
  if (Object.keys(fields).length) return failed('Please check the highlighted fields.', fields)
  const clash = await db.promoCode.findFirst({ where: { code, NOT: id ? { id } : undefined } })
  if (clash) return failed('That code already exists.', { code: 'Already in use.' })
  const data = { code, type, value, minSpendCents: minSpend!, startsAt, endsAt, maxUses, isActive: bool(form, 'isActive') }
  if (id) await db.promoCode.update({ where: { id }, data })
  else await db.promoCode.create({ data })
  refresh()
  return saved()
}

export async function deletePromoAction(form: FormData) {
  await requireAdmin()
  await db.promoCode.deleteMany({ where: { id: str(form, 'id') } })
  refresh()
}

// ───────────────────────── Testimonials and announcement bar ─────────────────────────

export async function saveTestimonialAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(form, 'id')
  const name = str(form, 'name')
  const quote = str(form, 'quote')
  const fields: FieldErrors = {}
  if (!name) fields.name = "Enter the customer's name."
  if (quote.length < 10) fields.quote = 'Enter what the customer said.'
  if (Object.keys(fields).length) return failed('Please check the highlighted fields.', fields)
  const data = { name, quote: quote.slice(0, 600), context: str(form, 'context').slice(0, 80), isPublished: bool(form, 'isPublished'), sortOrder: int(form, 'sortOrder') }
  if (id) await db.testimonial.update({ where: { id }, data })
  else await db.testimonial.create({ data })
  refresh()
  return saved(data.isPublished ? 'Saved and published on the homepage.' : 'Saved as a draft. Tick "Show on the website" to publish it.')
}

export async function deleteTestimonialAction(form: FormData) {
  await requireAdmin()
  await db.testimonial.deleteMany({ where: { id: str(form, 'id') } })
  refresh()
}

export async function saveBannerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = str(form, 'id')
  const text = str(form, 'text')
  const linkUrl = str(form, 'linkUrl')
  const fields: FieldErrors = {}
  if (!text) fields.text = 'Enter the announcement.'
  if (linkUrl && !(linkUrl.startsWith('/') || /^https:\/\//.test(linkUrl))) fields.linkUrl = 'Use a page on this site (for example /shop) or a full https:// address.'
  if (Object.keys(fields).length) return failed('Please check the highlighted fields.', fields)
  const data = { text: text.slice(0, 160), linkUrl: linkUrl || null, linkLabel: str(form, 'linkLabel').slice(0, 40) || null, isActive: bool(form, 'isActive'), sortOrder: int(form, 'sortOrder') }
  if (id) await db.banner.update({ where: { id }, data })
  else await db.banner.create({ data })
  refresh()
  return saved()
}

export async function deleteBannerAction(form: FormData) {
  await requireAdmin()
  await db.banner.deleteMany({ where: { id: str(form, 'id') } })
  refresh()
}

// ───────────────────────── Appointments and enquiries ─────────────────────────

const REQUEST_STATUSES: RequestStatus[] = ['NEW', 'CONFIRMED', 'DONE', 'DECLINED']

export async function setRequestStatusAction(form: FormData) {
  await requireAdmin()
  const id = str(form, 'id')
  const status = str(form, 'status') as RequestStatus
  if (!REQUEST_STATUSES.includes(status)) return
  if (str(form, 'kind') === 'appointment') {
    await db.appointment.updateMany({ where: { id }, data: { status, adminNote: str(form, 'adminNote').slice(0, 500) } })
    revalidatePath('/admin/appointments')
  } else {
    await db.enquiry.updateMany({ where: { id }, data: { status } })
    revalidatePath('/admin/enquiries')
  }
  revalidatePath('/admin')
}

// ───────────────────────── Orders ─────────────────────────

const STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'READY_FOR_COLLECTION', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

export async function orderStatusAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  const to = str(form, 'to') as OrderStatus
  if (!STATUSES.includes(to)) return failed('Choose a status.')
  const trackingUrl = str(form, 'trackingUrl')
  if (trackingUrl && !/^https:\/\//.test(trackingUrl)) return failed('The tracking link must start with https://', { trackingUrl: 'Must start with https://' })
  try {
    const result = await changeOrderStatus(str(form, 'orderId'), to, admin.email, { trackingNumber: str(form, 'trackingNumber'), trackingUrl, note: str(form, 'note').slice(0, 300) })
    if (!result.ok) return failed(result.message)
  } catch (err) {
    return failed(err instanceof Error ? err.message : 'The status could not be changed.')
  }
  revalidatePath('/admin', 'layout')
  return saved(`Status updated. ${emailed()}`)
}

export async function orderNoteAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  const note = str(form, 'note').slice(0, 1000)
  if (!note) return failed('Write a note first.')
  await db.orderEvent.create({ data: { orderId: str(form, 'orderId'), kind: 'note', message: note, actor: admin.email } })
  revalidatePath('/admin/orders', 'layout')
  return saved('Note added. Customers cannot see notes.')
}

export async function orderResolveAction(form: FormData) {
  const admin = await requireAdmin()
  const orderId = str(form, 'orderId')
  await db.order.update({
    where: { id: orderId },
    data: { needsAttention: null, events: { create: { kind: 'note', message: 'Marked as resolved.', actor: admin.email } } },
  })
  revalidatePath('/admin', 'layout')
}

export async function orderResendAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  await requireAdmin()
  const order = await db.order.findUnique({ where: { id: str(form, 'orderId') }, include: { items: true } })
  if (!order || !order.paidAt) return failed('Only paid orders have a confirmation to send.')
  await sendOrderConfirmation(order)
  revalidatePath('/admin/orders', 'layout')
  return saved('Confirmation email sent again. Check the timeline below for the result.')
}

/** Asks Yoco to refund the payment. The order changes to Refunded when Yoco confirms it by webhook. */
export async function orderRefundAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!bool(form, 'confirm')) return failed('Tick the box to confirm the refund.')
  const order = await db.order.findUnique({ where: { id: str(form, 'orderId') } })
  if (!order) return failed('Order not found.')
  if (!canRefund(order.status)) return failed('This order cannot be refunded in its current status.')
  if (!order.yocoCheckoutId) return failed('This order has no Yoco payment linked to it.')

  const remaining = order.totalCents - order.refundedCents
  const amountRaw = str(form, 'amount')
  const amount = amountRaw ? parseRandsToCents(amountRaw) : remaining
  if (amount == null || amount < 1) return failed('Enter the amount to refund in Rand.', { amount: 'Enter an amount in Rand.' })
  if (amount > remaining) return failed(`You can refund up to ${formatZAR(remaining)} on this order.`, { amount: `At most ${formatZAR(remaining)}.` })

  try {
    const full = amount === order.totalCents && order.refundedCents === 0
    const result = await refundCheckout(order.yocoCheckoutId, full ? undefined : amount, `refund-${order.id}-${order.refundedCents}-${amount}`)
    await db.orderEvent.create({
      data: {
        orderId: order.id,
        kind: 'refund',
        actor: admin.email,
        message: `Refund of ${formatZAR(amount)} requested from Yoco${result.refundId ? ` (${result.refundId})` : ''}. Waiting for Yoco to confirm.`,
      },
    })
  } catch (err) {
    const message = err instanceof YocoError ? err.message : 'Yoco could not be reached.'
    await db.orderEvent.create({ data: { orderId: order.id, kind: 'refund', actor: admin.email, message: `Refund request failed: ${message}` } })
    revalidatePath('/admin/orders', 'layout')
    return failed(`The refund was not sent. ${message} Refunds are not available in test mode. You can also refund from the Yoco app and then use "Record a refund made elsewhere".`)
  }
  revalidatePath('/admin', 'layout')
  return saved('Refund requested. The order will change to Refunded as soon as Yoco confirms it.')
}

/** For refunds made outside the website (for example in the Yoco app or in cash at the store). */
export async function orderManualRefundAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdmin()
  if (!bool(form, 'confirm')) return failed('Tick the box to confirm that the customer has already been refunded.')
  const order = await db.order.findUnique({ where: { id: str(form, 'orderId') } })
  if (!order) return failed('Order not found.')
  if (!canRefund(order.status)) return failed('This order cannot be refunded in its current status.')
  const applied = await applyRefund(order.id, order.totalCents, true, `Recorded as refunded in full outside the website${str(form, 'note') ? `: ${str(form, 'note').slice(0, 200)}` : ''}.`, admin.email)
  if (applied) after(() => notifyStatus(order.id))
  revalidatePath('/admin', 'layout')
  return saved(`Order marked as refunded. ${emailed()}`)
}

// ───────────────────────── Products ─────────────────────────

const hexField = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Choose a colour.')
const money = z.string().trim().max(20)

const productSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(1, 'Enter the product name.').max(120),
  slug: slugField,
  sku: z.string().trim().min(1, 'Enter a reference.').max(40).regex(/^[A-Za-z0-9._-]+$/, 'Use letters, numbers, dots and hyphens only.'),
  categoryId: z.string().max(40).nullable(),
  summary: z.string().trim().max(300),
  description: z.string().trim().max(6000),
  price: money,
  compareAt: money,
  fit: z.string().trim().max(1500),
  fabric: z.string().trim().max(1500),
  specs: z.string().trim().max(3000),
  care: z.string().trim().max(3000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
  isBestSeller: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
  occasionIds: z.array(z.string().max(40)).max(30),
  colours: z
    .array(
      z.object({
        id: z.string().max(40).optional(),
        name: z.string().trim().min(1, 'Name this colour.').max(60),
        hex: hexField,
        family: z.string().refine((f) => COLOUR_FAMILIES.some((c) => c.id === f), 'Choose a colour group.'),
        variants: z
          .array(
            z.object({
              id: z.string().max(40).optional(),
              size: z.string().trim().min(1, 'Enter a size.').max(20),
              stock: z.number().int('Use a whole number.').min(0, 'Stock cannot be negative.').max(100000),
              sku: z.string().trim().max(40),
            }),
          )
          .max(60),
      }),
    )
    .max(20),
  images: z
    .array(
      z.object({
        id: z.string().max(40).optional(),
        url: z.string().regex(/^\/(products|media)\/[A-Za-z0-9._-]+$/, 'Invalid image.'),
        alt: z.string().trim().max(200),
        width: z.number().int().min(1).max(10000),
        height: z.number().int().min(1).max(10000),
        colourIndex: z.number().int().min(0).nullable(),
      }),
    )
    .max(30),
})

export type ProductInput = EditorProduct
export type SaveProductResult = { ok: true; id: string; message: string; product: EditorProduct } | { ok: false; message: string; fields?: FieldErrors }

export async function saveProductAction(input: ProductInput): Promise<SaveProductResult> {
  await requireAdmin()
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error) }
  const d = parsed.data
  const fields: FieldErrors = {}

  const priceCents = d.price ? parseRandsToCents(d.price) : null
  if (d.price && (priceCents == null || priceCents < 200)) fields.price = 'Enter the price in Rand, for example 3499. Leave it empty for "Price on request".'
  const compareAtCents = d.compareAt ? parseRandsToCents(d.compareAt) : null
  if (d.compareAt && compareAtCents == null) fields.compareAt = 'Enter an amount in Rand, or leave this empty.'
  if (compareAtCents != null && priceCents != null && compareAtCents <= priceCents) fields.compareAt = 'The "was" price must be higher than the current price.'

  const names = d.colours.map((c) => c.name.toLowerCase())
  d.colours.forEach((c, ci) => {
    if (names.indexOf(c.name.toLowerCase()) !== ci) fields[`colours.${ci}.name`] = 'Each colour needs a different name.'
    const sizes = c.variants.map((v) => v.size.toLowerCase())
    c.variants.forEach((v, vi) => {
      if (sizes.indexOf(v.size.toLowerCase()) !== vi) fields[`colours.${ci}.variants.${vi}.size`] = 'This size is listed twice.'
    })
  })
  const skus = d.colours.flatMap((c) => c.variants.map((v) => v.sku)).filter(Boolean)
  if (new Set(skus).size !== skus.length) fields._ = 'Two sizes share the same reference. Each size reference must be different, or left empty.'

  const [slugClash, skuClash] = await Promise.all([
    db.product.findFirst({ where: { slug: d.slug, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } }),
    db.product.findFirst({ where: { sku: d.sku, NOT: d.id ? { id: d.id } : undefined }, select: { id: true } }),
  ])
  if (slugClash) fields.slug = 'Another product already uses this web address.'
  if (skuClash) fields.sku = 'Another product already uses this reference.'
  if (skus.length) {
    const taken = await db.variant.findFirst({ where: { sku: { in: skus }, colour: { productId: d.id ? { not: d.id } : undefined } }, select: { sku: true } })
    if (taken) fields._ = `The size reference ${taken.sku} is already used by another product.`
  }
  if (Object.keys(fields).length) return { ok: false, message: fields._ ?? 'Please check the highlighted fields.', fields }

  const base = {
    name: d.name,
    slug: d.slug,
    sku: d.sku,
    categoryId: d.categoryId || null,
    summary: d.summary,
    description: d.description,
    priceCents,
    compareAtCents,
    fit: d.fit,
    fabric: d.fabric,
    specs: d.specs,
    care: d.care,
    isActive: d.isActive,
    isFeatured: d.isFeatured,
    isNewArrival: d.isNewArrival,
    isBestSeller: d.isBestSeller,
    sortOrder: d.sortOrder,
  }

  try {
    const id = await db.$transaction(async (tx) => {
      const product = d.id
        ? await tx.product.update({ where: { id: d.id }, data: { ...base, occasions: { set: d.occasionIds.map((oid) => ({ id: oid })) } } })
        : await tx.product.create({ data: { ...base, occasions: { connect: d.occasionIds.map((oid) => ({ id: oid })) } } })

      // Colours: remove the ones taken out, then update or create the rest in order.
      const keepColours = d.colours.map((c) => c.id).filter((x): x is string => Boolean(x))
      await tx.productColour.deleteMany({ where: { productId: product.id, id: { notIn: keepColours } } })
      const colourIds: string[] = []
      for (const [ci, c] of d.colours.entries()) {
        const colourData = { name: c.name, hex: c.hex.toLowerCase(), family: c.family, sortOrder: ci }
        const colour = c.id
          ? await tx.productColour.update({ where: { id: c.id, productId: product.id }, data: colourData })
          : await tx.productColour.create({ data: { ...colourData, productId: product.id } })
        colourIds.push(colour.id)

        const keepVariants = c.variants.map((v) => v.id).filter((x): x is string => Boolean(x))
        await tx.variant.deleteMany({ where: { colourId: colour.id, id: { notIn: keepVariants } } })
        for (const [vi, v] of c.variants.entries()) {
          const variantData = { size: v.size, stock: v.stock, sku: v.sku || null, sortOrder: vi }
          if (v.id) await tx.variant.update({ where: { id: v.id, colourId: colour.id }, data: variantData })
          else await tx.variant.create({ data: { ...variantData, colourId: colour.id } })
        }
      }

      const keepImages = d.images.map((i) => i.id).filter((x): x is string => Boolean(x))
      await tx.productImage.deleteMany({ where: { productId: product.id, id: { notIn: keepImages } } })
      for (const [ii, img] of d.images.entries()) {
        const imageData = { url: img.url, alt: img.alt, width: img.width, height: img.height, sortOrder: ii, colourId: img.colourIndex != null ? (colourIds[img.colourIndex] ?? null) : null }
        if (img.id) await tx.productImage.update({ where: { id: img.id, productId: product.id }, data: imageData })
        else await tx.productImage.create({ data: { ...imageData, productId: product.id } })
      }
      return product.id
    })
    refresh()
    const sellable = priceCents != null && d.colours.some((c) => c.variants.some((v) => v.stock > 0))
    const product = await loadEditorProduct(id)
    if (!product) return { ok: false, message: 'The product was saved but could not be reloaded. Refresh the page.' }
    return {
      ok: true,
      id,
      product,
      message: !d.isActive
        ? 'Saved. This product is hidden from the shop.'
        : sellable
          ? 'Saved. Customers can buy this product online.'
          : 'Saved. Customers can see this product but cannot buy it online until it has a price and at least one size in stock.',
    }
  } catch (err) {
    console.error('[admin] product save failed', err)
    return { ok: false, message: 'The product could not be saved. Check that each size appears only once per colour and try again.' }
  }
}

export async function deleteProductAction(form: FormData) {
  await requireAdmin()
  await db.product.deleteMany({ where: { id: str(form, 'id') } })
  refresh()
  redirect('/admin/products')
}

/** Quick stock change from the product list, without opening the full editor. */
export async function setStockAction(form: FormData) {
  await requireAdmin()
  const stock = int(form, 'stock', -1)
  if (stock < 0) return
  await db.variant.updateMany({ where: { id: str(form, 'variantId') }, data: { stock } })
  refresh()
}
