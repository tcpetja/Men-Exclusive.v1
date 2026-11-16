import { cache } from 'react'
import { db } from './db'
import { maybeExpireStaleOrders } from './orders'
import { COLOUR_FAMILIES } from './constants'
import type { Prisma } from '@/generated/prisma/client'

const cardInclude = {
  images: { orderBy: { sortOrder: 'asc' as const }, take: 2 },
  colours: { orderBy: { sortOrder: 'asc' as const }, include: { variants: true } },
  category: true,
} satisfies Prisma.ProductInclude

type ProductWithCard = Prisma.ProductGetPayload<{ include: typeof cardInclude }>

export type ProductCardData = {
  id: string
  slug: string
  sku: string
  name: string
  categoryName: string | null
  priceCents: number | null
  compareAtCents: number | null
  image: { url: string; alt: string; width: number; height: number } | null
  hoverImage: { url: string; alt: string } | null
  colours: { name: string; hex: string }[]
  /** In stock in at least one size. */
  inStock: boolean
  /** Has a price and stock, so it can be bought online right now. */
  purchasable: boolean
  isNewArrival: boolean
  isBestSeller: boolean
}

export function toCard(p: ProductWithCard): ProductCardData {
  const inStock = p.colours.some((c) => c.variants.some((v) => v.stock > 0))
  const [first, second] = p.images
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    categoryName: p.category?.name ?? null,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    image: first ? { url: first.url, alt: first.alt || p.name, width: first.width, height: first.height } : null,
    hoverImage: second ? { url: second.url, alt: second.alt || p.name } : null,
    colours: p.colours.map((c) => ({ name: c.name, hex: c.hex })),
    inStock,
    purchasable: inStock && p.priceCents != null,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
  }
}

export type ShopFilters = {
  category?: string
  occasion?: string
  colours?: string[]
  sizes?: string[]
  minCents?: number
  maxCents?: number
  inStockOnly?: boolean
  q?: string
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc'
}

function whereFor(f: ShopFilters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }]
  if (f.category) and.push({ category: { slug: f.category } })
  if (f.occasion) and.push({ occasions: { some: { slug: f.occasion } } })
  if (f.colours?.length) and.push({ colours: { some: { family: { in: f.colours } } } })
  if (f.sizes?.length) and.push({ colours: { some: { variants: { some: { size: { in: f.sizes }, stock: { gt: 0 } } } } } })
  if (f.minCents != null) and.push({ priceCents: { gte: f.minCents } })
  if (f.maxCents != null) and.push({ priceCents: { lte: f.maxCents } })
  if (f.inStockOnly) and.push({ colours: { some: { variants: { some: { stock: { gt: 0 } } } } } })
  const q = f.q?.trim()
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 6)
    for (const term of terms) {
      const contains = { contains: term, mode: 'insensitive' as const }
      and.push({
        OR: [
          { name: contains },
          { sku: contains },
          { summary: contains },
          { description: contains },
          { fabric: contains },
          { category: { name: contains } },
          { colours: { some: { name: contains } } },
          { occasions: { some: { name: contains } } },
        ],
      })
    }
  }
  return { AND: and }
}

function orderFor(sort: ShopFilters['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' }]
    case 'price-asc':
      return [{ priceCents: { sort: 'asc', nulls: 'last' } }, { sortOrder: 'asc' }]
    case 'price-desc':
      return [{ priceCents: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }]
    default:
      return [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
  }
}

export async function listProducts(filters: ShopFilters = {}, take = 200): Promise<ProductCardData[]> {
  await maybeExpireStaleOrders()
  const rows = await db.product.findMany({ where: whereFor(filters), orderBy: orderFor(filters.sort), include: cardInclude, take })
  return rows.map(toCard)
}

export async function listFlagged(flag: 'isFeatured' | 'isNewArrival' | 'isBestSeller', take = 8): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { isActive: true, [flag]: true },
    orderBy: flag === 'isNewArrival' ? [{ createdAt: 'desc' }] : [{ sortOrder: 'asc' }],
    include: cardInclude,
    take,
  })
  return rows.map(toCard)
}

export type Facets = {
  categories: { slug: string; name: string; count: number }[]
  colours: { id: string; label: string; hex: string }[]
  sizes: string[]
  priceRange: { minCents: number; maxCents: number } | null
  anyInStock: boolean
}

function sizeSort(a: string, b: string) {
  const na = parseFloat(a)
  const nb = parseFloat(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
  const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', '4XL', '5XL']
  const ia = order.indexOf(a.toUpperCase())
  const ib = order.indexOf(b.toUpperCase())
  if (ia !== -1 && ib !== -1) return ia - ib
  return a.localeCompare(b, 'en', { numeric: true })
}

/** What the filter panel should offer, based on what is actually in the catalogue (within an optional scope). */
export async function getFacets(scope: Pick<ShopFilters, 'occasion' | 'q'> = {}): Promise<Facets> {
  const rows = await db.product.findMany({
    where: whereFor(scope),
    select: {
      priceCents: true,
      category: { select: { slug: true, name: true, sortOrder: true } },
      colours: { select: { family: true, variants: { select: { size: true, stock: true } } } },
    },
  })
  const cats = new Map<string, { slug: string; name: string; count: number; sortOrder: number }>()
  const families = new Set<string>()
  const sizes = new Set<string>()
  let min = Infinity
  let max = -Infinity
  let anyInStock = false
  for (const p of rows) {
    if (p.category) {
      const c = cats.get(p.category.slug) ?? { ...p.category, count: 0 }
      c.count++
      cats.set(p.category.slug, c)
    }
    if (p.priceCents != null) {
      min = Math.min(min, p.priceCents)
      max = Math.max(max, p.priceCents)
    }
    for (const c of p.colours) {
      families.add(c.family)
      for (const v of c.variants) {
        if (v.stock > 0) {
          sizes.add(v.size)
          anyInStock = true
        }
      }
    }
  }
  return {
    categories: [...cats.values()].sort((a, b) => a.sortOrder - b.sortOrder).map(({ slug, name, count }) => ({ slug, name, count })),
    colours: COLOUR_FAMILIES.filter((f) => families.has(f.id)).map((f) => ({ ...f })),
    sizes: [...sizes].sort(sizeSort),
    priceRange: Number.isFinite(min) ? { minCents: min, maxCents: max } : null,
    anyInStock,
  }
}

const detailInclude = {
  images: { orderBy: { sortOrder: 'asc' as const } },
  colours: { orderBy: { sortOrder: 'asc' as const }, include: { variants: { orderBy: { sortOrder: 'asc' as const } } } },
  category: true,
  occasions: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.ProductInclude

export type ProductDetail = Prisma.ProductGetPayload<{ include: typeof detailInclude }>

export const getProduct = cache(async (slug: string): Promise<ProductDetail | null> => {
  await maybeExpireStaleOrders()
  const product = await db.product.findUnique({ where: { slug }, include: detailInclude })
  if (!product || !product.isActive) return null
  for (const c of product.colours) c.variants.sort((a, b) => a.sortOrder - b.sortOrder || sizeSort(a.size, b.size))
  return product
})

export async function relatedProducts(product: ProductDetail, take = 4): Promise<ProductCardData[]> {
  const occasionIds = product.occasions.map((o) => o.id)
  const rows = await db.product.findMany({
    where: {
      isActive: true,
      id: { not: product.id },
      OR: [
        ...(product.categoryId ? [{ categoryId: product.categoryId }] : []),
        ...(occasionIds.length ? [{ occasions: { some: { id: { in: occasionIds } } } }] : []),
      ],
    },
    orderBy: [{ sortOrder: 'asc' }],
    include: cardInclude,
    take: 12,
  })
  // Prefer the same category first, then shared occasions.
  rows.sort((a, b) => Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId))
  return rows.slice(0, take).map(toCard)
}

export const getOccasions = cache(async () =>
  db.occasion.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: { where: { isActive: true } } } } } }),
)

export async function getOccasion(slug: string) {
  return db.occasion.findUnique({ where: { slug } })
}

/** Parses a specs block ("Label: value" per line) into rows for display. */
export function parseSpecs(specs: string): { label: string; value: string }[] {
  return specs
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf(':')
      return i === -1 ? { label: '', value: line } : { label: line.slice(0, i).trim(), value: line.slice(i + 1).trim() }
    })
}
