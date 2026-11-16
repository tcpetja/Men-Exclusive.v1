import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'
import type { Prisma } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Products and stock' }

const VIEWS: { id: string; label: string; where: Prisma.ProductWhereInput }[] = [
  { id: 'all', label: 'All products', where: {} },
  { id: 'no-price', label: 'No price yet', where: { priceCents: null } },
  { id: 'no-sizes', label: 'No sizes yet', where: { colours: { none: { variants: { some: {} } } } } },
  { id: 'low-stock', label: 'Low or out of stock', where: { colours: { some: { variants: { some: { stock: { lte: 1 } } } } } } },
  { id: 'hidden', label: 'Hidden', where: { isActive: false } },
]

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ show?: string; q?: string }> }) {
  const { show = 'all', q = '' } = await searchParams
  const view = VIEWS.find((v) => v.id === show) ?? VIEWS[0]
  const term = q.trim().slice(0, 60)
  const products = await db.product.findMany({
    where: {
      AND: [view.where, term ? { OR: [{ name: { contains: term, mode: 'insensitive' } }, { sku: { contains: term, mode: 'insensitive' } }] } : {}],
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, colours: { include: { variants: true } }, category: true },
  })

  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Products and stock</h1>
          <p className="a-sub">A product can be bought online once it has a price and at least one size in stock. Until then customers see “Price on request” and can enquire on WhatsApp.</p>
        </div>
        <div className="a-actions">
          <form method="get" className="a-actions">
            <input type="hidden" name="show" value={view.id} />
            <label htmlFor="product-q" className="sr-only">
              Search products
            </label>
            <input id="product-q" name="q" className="a-input" defaultValue={term} placeholder="Name or reference" style={{ width: 200 }} />
            <button type="submit" className="a-btn">
              Search
            </button>
          </form>
          <Link href="/admin/products/new" className="a-btn a-btn-primary">
            Add a product
          </Link>
        </div>
      </div>
      <div className="a-filters">
        {VIEWS.map((v) => (
          <Link key={v.id} href={`/admin/products?show=${v.id}`} aria-current={v.id === view.id}>
            {v.label}
          </Link>
        ))}
      </div>
      <section className="a-card">
        {products.length === 0 ? (
          <p className="a-empty">No products in this view.</p>
        ) : (
          <div className="a-table-wrap" style={{ marginTop: -20 }}>
            <table className="a-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Suit type</th>
                  <th className="a-num">Price</th>
                  <th>Sizes and stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const variants = p.colours.flatMap((c) => c.variants.map((v) => ({ ...v, colour: c.name })))
                  const stock = variants.reduce((n, v) => n + v.stock, 0)
                  const sellable = p.isActive && p.priceCents != null && stock > 0
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.images[0] ? <img src={p.images[0].url} alt="" className="a-thumb" loading="lazy" /> : <span className="a-thumb" />}
                          <span>
                            <Link href={`/admin/products/${p.id}`}>{p.name}</Link>
                            <div className="a-meta">Ref {p.sku}</div>
                          </span>
                        </div>
                      </td>
                      <td>{p.category?.name ?? <span className="a-meta">None</span>}</td>
                      <td className="a-num">{p.priceCents != null ? formatZAR(p.priceCents) : <span className="a-pill a-pill-warn">Not set</span>}</td>
                      <td>
                        {variants.length === 0 ? (
                          <span className="a-pill a-pill-warn">No sizes</span>
                        ) : (
                          <>
                            {stock} in stock
                            <div className="a-meta">
                              {variants
                                .slice(0, 8)
                                .map((v) => `${v.size}: ${v.stock}`)
                                .join(', ')}
                              {variants.length > 8 ? ' …' : ''}
                            </div>
                          </>
                        )}
                      </td>
                      <td>
                        {!p.isActive ? <span className="a-pill">Hidden</span> : sellable ? <span className="a-pill a-pill-ok">On sale online</span> : <span className="a-pill a-pill-warn">Enquiry only</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
