import Link from 'next/link'
import { db } from '@/lib/db'
import { IconChevron } from './icons'

/**
 * Shop by occasion as a typographic index: names, a line of guidance and a count. No photographs, so the
 * choice reads at a glance.
 */
export async function OccasionIndex() {
  const occasions = await db.occasion.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { slug: true, name: true, tagline: true, _count: { select: { products: { where: { isActive: true } } } } },
  })
  if (occasions.length === 0) return null
  return (
    <ul className="index">
      {occasions.map((o) => (
        <li key={o.slug}>
          <Link href={`/occasions/${o.slug}`} className="index-row">
            <span className="index-name">{o.name}</span>
            <span className="index-note">{o.tagline}</span>
            <span className="index-count">{o._count.products > 0 ? `${o._count.products} ${o._count.products === 1 ? 'suit' : 'suits'}` : 'Ask us'}</span>
            <IconChevron className="index-arrow" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
