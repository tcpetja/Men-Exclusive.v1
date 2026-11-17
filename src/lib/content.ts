import { cache } from 'react'
import { db } from './db'
import { CONTENT_BY_KEY } from '@/content/defaults'
import { addressLines, getSettings, type StoreSettings } from './settings'

const loadOverrides = cache(async () => {
  const rows = await db.contentBlock.findMany()
  return new Map(rows.map((r) => [r.key, r.body]))
})

function placeholders(s: StoreSettings): Record<string, string> {
  return {
    storeName: s.storeName,
    legalName: s.legalName || s.storeName,
    registrationNumber: s.registrationNumber,
    vatNumber: s.vatNumber,
    informationOfficer: s.informationOfficer,
    address: addressLines(s).join(', '),
    email: s.email,
    phone: s.phone,
  }
}

/** Fills {{placeholders}}. A line that depends on a value the store has not provided is dropped entirely. */
export function fillPlaceholders(body: string, values: Record<string, string>): string {
  return body
    .split('\n')
    .filter((line) => {
      const used = [...line.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1])
      return used.every((k) => (values[k] ?? '').trim() !== '')
    })
    .join('\n')
    .replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? '')
}

/** Returns editable copy for a key: the admin's version if there is one, otherwise the default. */
export async function getContent(key: string): Promise<string> {
  const [overrides, settings] = await Promise.all([loadOverrides(), getSettings()])
  const raw = overrides.get(key) ?? CONTENT_BY_KEY[key]?.body ?? ''
  return fillPlaceholders(raw, placeholders(settings))
}

export async function getContents<K extends string>(keys: K[]): Promise<Record<K, string>> {
  const entries = await Promise.all(keys.map(async (k) => [k, await getContent(k)] as const))
  return Object.fromEntries(entries) as Record<K, string>
}
