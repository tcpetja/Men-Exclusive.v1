import Image from 'next/image'
import Link from 'next/link'
import type { ProductCardData } from '@/lib/catalog'
import { formatZAR } from '@/lib/money'

export function ProductCard({ product, sizes, priority = false }: { product: ProductCardData; sizes?: string; priority?: boolean }) {
  const p = product
  const tag = p.priceCents != null && !p.inStock && p.colours.length > 0 ? 'Sold out' : p.isNewArrival ? 'New' : p.isBestSeller ? 'Best seller' : null
  return (
    <Link href={`/shop/${p.slug}`} className="card">
      <div className="card-media">
        {tag && <span className="tag">{tag}</span>}
        {p.image && (
          <Image
            src={p.image.url}
            alt={p.image.alt}
            fill
            sizes={sizes ?? '(min-width: 1100px) 25vw, (min-width: 760px) 33vw, 50vw'}
            priority={priority}
          />
        )}
        {p.hoverImage && <Image src={p.hoverImage.url} alt="" fill sizes={sizes ?? '(min-width: 1100px) 25vw, (min-width: 760px) 33vw, 50vw'} className="card-alt" />}
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

export function ProductGrid({ products, four = true }: { products: ProductCardData[]; four?: boolean }) {
  return (
    <div className={four ? 'grid grid-4' : 'grid'}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  )
}
