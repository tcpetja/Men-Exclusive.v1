import { headers } from 'next/headers'
import { db } from './db'

/**
 * Fixed-window rate limiter backed by Postgres so it works across serverless instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart") VALUES (${key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds})
                       THEN 1 ELSE "RateLimit"."count" + 1 END,
        "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds})
                       THEN now() ELSE "RateLimit"."windowStart" END
      RETURNING "count"`
    return Number(rows[0]?.count ?? 1) <= limit
  } catch (err) {
    console.error('[rate-limit] check failed, allowing request', err)
    return true
  }
}

export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
