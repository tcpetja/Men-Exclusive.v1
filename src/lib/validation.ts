import { z } from 'zod'
import { SA_PROVINCES } from './constants'

export type FieldErrors = Record<string, string>
export type ActionState = { ok?: boolean; message?: string; fields?: FieldErrors; values?: Record<string, string> } | null

/** Turns zod issues into { fieldName: message }, keeping the first message per field. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

const trimmed = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`)
const required = (label: string, max = 120) => trimmed(max).min(1, `Enter ${label}.`)

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email address.')
  .max(254)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address, like name@example.com.')

/** Accepts South African numbers (082 123 4567, +27 82 123 4567) and international numbers starting with +. */
export const phoneField = z
  .string()
  .trim()
  .min(1, 'Enter your phone number.')
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => /^(0\d{9}|\+\d{9,15})$/.test(v), 'Enter a valid phone number, like 082 123 4567.')

export const passwordField = z
  .string()
  .min(10, 'Use at least 10 characters.')
  .max(200, 'Use fewer than 200 characters.')

export const registerSchema = z.object({
  firstName: required('your first name', 60),
  lastName: required('your surname', 60),
  email: emailField,
  phone: phoneField.optional().or(z.literal('')),
  password: passwordField,
  marketingOptIn: z.boolean().default(false),
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password.').max(200),
})

export const profileSchema = z.object({
  firstName: required('your first name', 60),
  lastName: required('your surname', 60),
  phone: phoneField.optional().or(z.literal('')),
  marketingOptIn: z.boolean().default(false),
})

export const addressSchema = z.object({
  recipient: required('the name of the person receiving the order', 100),
  phone: phoneField,
  line1: required('the street address', 120),
  line2: trimmed(120).optional().default(''),
  suburb: required('the suburb', 80),
  city: required('the city or town', 80),
  province: z.enum(SA_PROVINCES, { message: 'Choose a province.' }),
  postalCode: z.string().trim().regex(/^\d{4}$/, 'Enter a 4-digit postal code.'),
})

export const shippingSchema = addressSchema.omit({ recipient: true, phone: true })

export const checkoutSchema = z.object({
  firstName: required('your first name', 60),
  lastName: required('your surname', 60),
  email: emailField,
  phone: phoneField,
  deliveryMethodId: z.string().min(1, 'Choose how you would like to receive your order.'),
  promoCode: trimmed(40).optional().default(''),
  customerNote: trimmed(500).optional().default(''),
  expectedTotalCents: z.number().int().nonnegative(),
  acceptTerms: z.literal(true, { message: 'Please accept the terms and conditions to continue.' }),
  lines: z
    .array(z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(10) }))
    .min(1, 'Your bag is empty.')
    .max(50),
  address: shippingSchema.nullable(),
})

export const appointmentSchema = z.object({
  name: required('your name', 100),
  phone: phoneField,
  email: emailField.optional().or(z.literal('')),
  purpose: required('the purpose of your appointment', 80),
  occasion: trimmed(80).optional().default(''),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.')
    .refine((d) => d >= new Date().toISOString().slice(0, 10), 'Choose a date from today onwards.'),
  preferredTime: required('a preferred time', 40),
  notes: trimmed(1000).optional().default(''),
})

export const enquirySchema = z
  .object({
    name: required('your name', 100),
    email: emailField.optional().or(z.literal('')),
    phone: phoneField.optional().or(z.literal('')),
    topic: required('a topic', 80),
    message: required('your message', 2000),
  })
  .refine((v) => v.email || v.phone, { path: ['email'], message: 'Enter an email address or phone number so we can reply.' })

export const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Enter a URL name.')
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.')

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
