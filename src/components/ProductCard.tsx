import Link from 'next/link'
import type { ProductCardData } from '@/lib/catalog'
import { formatZAR } from '@/lib/money'
import { Shot } from './Shot'

const CARD_SIZES = '(min-width: 1100px) 44vw, (min-width: 760px) 46vw, 70vw'

export function ProductCard({ product, sizes = CARD_SIZES, priority = false }: { product: ProductCardData; sizes?: string; priority?: boolean }) {
  const p = product
  const tag = p.priceCents != null && !p.inStock && p.colours.length > 0 ? 'Sold out' : p.isNewArrival ? 'New' : p.isBestSeller ? 'Best seller' : null
  return (
    <Link href={`/shop/${p.slug}`} className="card">
      <div className="card-media">
        {p.image && <Shot image={p.image} sizes={sizes} priority={priority} />}
        {tag && <span className="tag">{tag}</span>}
      </div>
      <div className="card-body">
        <h3 className="card-name">{p.name}</h3>
        {p.priceCents != null ? (
          <p className="price">
            {formatZAR(p.priceCents)}
            {p.compareAtCents != null && p.compareAtCents > p.priceCents && <span className="price-was">{formatZAR(p.compareAtCents)}</span>}
          </p>
        ) : (
          <p className="price-request">Price on request</p>
        )}
        {p.colours.length > 1 && (
          <div className="dots" aria-label={`Available in ${p.colours.map((c) => c.name).join(', ')}`}>
            {p.colours.slice(0, 6).map((c) => (
              <span key={c.name} className="dot" style={{ background: c.hex }} />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export function ProductGrid({ products, columns = 3 }: { products: ProductCardData[]; columns?: 3 | 4 }) {
  return (
    <div className={columns === 4 ? 'grid grid-4' : 'grid'}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 3} />
      ))}
    </div>
  )
}
