import sharp from 'sharp'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 12 * 1024 * 1024

/**
 * Receives a product photograph from the admin, straightens it using its EXIF orientation, resizes it to a
 * sensible maximum and stores it as WebP in the database, so it works on any host without extra storage.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') return Response.json({ error: 'Not allowed.' }, { status: 403 })
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))) {
    return Response.json({ error: 'Not allowed.' }, { status: 403 })
  }

  let file: FormDataEntryValue | null
  try {
    file = (await request.formData()).get('file')
  } catch {
    return Response.json({ error: 'The upload could not be read.' }, { status: 400 })
  }
  if (!(file instanceof File)) return Response.json({ error: 'Choose a photograph to upload.' }, { status: 400 })
  if (file.size > MAX_BYTES) return Response.json({ error: 'That photograph is too large. Use one under 12 MB.' }, { status: 413 })

  try {
    const input = Buffer.from(await file.arrayBuffer())
    const { data, info } = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width: 1800, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })
    const asset = await db.mediaAsset.create({ data: { data: new Uint8Array(data), mime: 'image/webp', width: info.width, height: info.height, bytes: data.length } })
    return Response.json({ url: `/media/${asset.id}.webp`, width: info.width, height: info.height })
  } catch {
    return Response.json({ error: 'That file is not a photograph we can use. Upload a JPG, PNG or WebP image.' }, { status: 415 })
  }
}
