import { db } from './db'
import { centsToRandsInput } from './money'

/** The shape the admin product editor works with. Images point at their colour by position in the list. */
export type EditorProduct = {
  id?: string
  name: string
  slug: string
  sku: string
  categoryId: string | null
  summary: string
  description: string
  price: string
  compareAt: string
  fit: string
  fabric: string
  specs: string
  care: string
  isActive: boolean
  isFeatured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  sortOrder: number
  occasionIds: string[]
  colours: { id?: string; name: string; hex: string; family: string; variants: { id?: string; size: string; stock: number; sku: string }[] }[]
  images: { id?: string; url: string; alt: string; width: number; height: number; colourIndex: number | null }[]
}

export async function loadEditorProduct(id: string): Promise<EditorProduct | null> {
  const p = await db.product.findUnique({
    where: { id },
    include: {
      occasions: { select: { id: true } },
      colours: { orderBy: { sortOrder: 'asc' }, include: { variants: { orderBy: { sortOrder: 'asc' } } } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!p) return null
  const colourIndex = new Map(p.colours.map((c, i) => [c.id, i]))
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categoryId: p.categoryId,
    summary: p.summary,
    description: p.description,
    price: centsToRandsInput(p.priceCents),
    compareAt: centsToRandsInput(p.compareAtCents),
    fit: p.fit,
    fabric: p.fabric,
    specs: p.specs,
    care: p.care,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    sortOrder: p.sortOrder,
    occasionIds: p.occasions.map((o) => o.id),
    colours: p.colours.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      family: c.family,
      variants: c.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock, sku: v.sku ?? '' })),
    })),
    images: p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt, width: i.width, height: i.height, colourIndex: i.colourId ? (colourIndex.get(i.colourId) ?? null) : null })),
  }
}

export async function blankEditorProduct(): Promise<EditorProduct> {
  const [count, last] = await Promise.all([db.product.count(), db.product.findFirst({ orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })])
  // Suggest the next free reference in the ME-S-001 series.
  let n = count + 1
  let sku = `ME-S-${String(n).padStart(3, '0')}`
  while (await db.product.findUnique({ where: { sku }, select: { id: true } })) sku = `ME-S-${String(++n).padStart(3, '0')}`
  return {
    name: '',
    slug: '',
    sku,
    categoryId: null,
    summary: '',
    description: '',
    price: '',
    compareAt: '',
    fit: '',
    fabric: '',
    specs: '',
    care: '',
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    sortOrder: (last?.sortOrder ?? 0) + 1,
    occasionIds: [],
    colours: [{ name: '', hex: '#1a1a1a', family: 'black', variants: [] }],
    images: [],
  }
}
