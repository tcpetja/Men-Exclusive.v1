import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** Serves photographs uploaded through the admin. Files never change once stored, so they are cached for a year. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  const id = file.replace(/\.webp$/, '')
  if (!/^[a-z0-9]{10,40}$/.test(id)) return new Response('Not found', { status: 404 })
  const asset = await db.mediaAsset.findUnique({ where: { id } })
  if (!asset) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(asset.data), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(asset.bytes),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
