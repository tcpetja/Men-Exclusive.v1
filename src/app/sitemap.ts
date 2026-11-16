import type { MetadataRoute } from 'next'
import { POLICY_PAGES } from '@/lib/constants'
import { db } from '@/lib/db'
import { siteUrl } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const [products, occasions] = await Promise.all([
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    db.occasion.findMany({ select: { slug: true } }),
  ])
  const fixed = ['', '/shop', '/occasions', '/fabrics-craftsmanship', '/our-story', '/fittings-alterations', '/contact', '/book']
  return [
    ...fixed.map((path) => ({ url: base + path, changeFrequency: 'weekly' as const, priority: path === '' ? 1 : 0.8 })),
    ...occasions.map((o) => ({ url: `${base}/occasions/${o.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/shop/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...POLICY_PAGES.map((p) => ({ url: `${base}/policies/${p.slug}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ]
}
