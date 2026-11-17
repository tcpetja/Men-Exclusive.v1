import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Newsletter subscribers as a CSV file, for importing into an email marketing tool. */
export async function GET() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return new Response('Not allowed', { status: 403 })
  const rows = await db.subscriber.findMany({ orderBy: { consentAt: 'desc' } })
  const csv = ['email,subscribed_at,source', ...rows.map((r) => `${r.email},${r.consentAt.toISOString()},${r.source}`)].join('\n')
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="men-exclusive-newsletter.csv"', 'Cache-Control': 'private, no-store' },
  })
}
