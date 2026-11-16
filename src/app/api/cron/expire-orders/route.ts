import { expireStaleOrders } from '@/lib/orders'

export const dynamic = 'force-dynamic'

/**
 * Releases the stock held by unpaid orders that have run out of time.
 * The site already does this by itself while people browse; this endpoint lets a scheduler do it too
 * (see vercel.json). Protected by CRON_SECRET.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const expired = await expireStaleOrders()
  return Response.json({ expired })
}
