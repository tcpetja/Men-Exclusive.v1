import { cache } from 'react'
import { db } from './db'

/**
 * Store settings, editable in Admin → Store settings.
 * Defaults below come from the MEN EXCLUSIVE company profile and brand guidelines.
 * Anything the business has not confirmed (trading hours, company registration, social links)
 * is left empty and simply does not appear on the site until it is filled in.
 */
export type StoreSettings = {
  storeName: string
  tagline: string
  phone: string
  phoneAlt: string
  whatsapp: string
  email: string
  building: string
  street: string
  city: string
  province: string
  postalCode: string
  mapUrl: string
  /** One line per entry, e.g. "Monday to Friday: 09:00 – 17:00". */
  hours: string
  instagram: string
  facebook: string
  tiktok: string
  legalName: string
  registrationNumber: string
  vatNumber: string
  informationOfficer: string
  /** Where new-order and enquiry notifications are sent. Falls back to the store email. */
  notifyEmail: string
  /** How long an unpaid order holds its stock before it is cancelled automatically. */
  reservationMinutes: number
  gaMeasurementId: string
  searchConsoleVerification: string
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'MEN EXCLUSIVE',
  tagline: 'Dress to impress',
  phone: '+27 63 051 2118',
  phoneAlt: '+27 81 091 6547',
  whatsapp: '+27 63 051 2118',
  email: 'atmenexclusive4@gmail.com',
  building: "Nunnerley's Buildings",
  street: '98 Helen Joseph Street',
  city: 'Johannesburg',
  province: 'Gauteng',
  postalCode: '2000',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=98+Helen+Joseph+Street+Johannesburg+2000',
  hours: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  legalName: '',
  registrationNumber: '',
  vatNumber: '',
  informationOfficer: '',
  notifyEmail: '',
  reservationMinutes: 60,
  gaMeasurementId: '',
  searchConsoleVerification: '',
}

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.setting.findMany()
  const stored: Record<string, unknown> = {}
  for (const r of rows) stored[r.key] = r.value
  const merged = { ...DEFAULT_SETTINGS } as Record<string, unknown>
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const v = stored[key]
    if (v !== undefined && v !== null && typeof v === typeof merged[key]) merged[key] = v
  }
  return merged as StoreSettings
})

export async function saveSettings(patch: Partial<StoreSettings>) {
  await db.$transaction(
    Object.entries(patch).map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } }),
    ),
  )
}

export function addressLines(s: StoreSettings): string[] {
  return [s.building, s.street, [s.city, s.postalCode].filter(Boolean).join(', '), s.province].filter(Boolean)
}

export function siteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}
