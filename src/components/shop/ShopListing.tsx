import Link from 'next/link'
import { ProductGrid } from '@/components/ProductCard'
import { WhatsAppButton } from '@/components/WhatsApp'
import { getFacets, listProducts, type ShopFilters } from '@/lib/catalog'
import { parseRandsToCents } from '@/lib/money'
import { waMessages } from '@/lib/whatsapp'
import { FiltersForm } from './FiltersForm'

export type RawSearchParams = Record<string, string | string[] | undefined>

const many = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]).filter(Boolean).slice(0, 20)
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
] as const

export function parseFilters(sp: RawSearchParams): ShopFilters {
  const sort = one(sp.sort)
  return {
    category: one(sp.category) || undefined,
    colours: many(sp.colour),
    sizes: many(sp.size),
    minCents: parseRandsToCents(one(sp.min)) ?? undefined,
    maxCents: parseRandsToCents(one(sp.max)) ?? undefined,
    inStockOnly: one(sp.stock) === '1',
    sort: SORTS.some((s) => s.value === sort) ? (sort as ShopFilters['sort']) : 'featured',
  }
}

/**
 * Product listing with filters for suit type, colour, size, price and availability.
 * Filters are only offered when the catalogue has something to filter on — for example the size and price
 * filters appear once products have sizes and prices.
 */
export async function ShopListing({
  basePath,
  searchParams,
  scope = {},
  emptyMessage,
}: {
  basePath: string
  searchParams: RawSearchParams
  scope?: Pick<ShopFilters, 'occasion' | 'q'>
  emptyMessage?: string
}) {
  const filters = { ...parseFilters(searchParams), ...scope }
  const [products, facets] = await Promise.all([listProducts(filters), getFacets(scope)])
  const active =
    Boolean(filters.category) || (filters.colours?.length ?? 0) > 0 || (filters.sizes?.length ?? 0) > 0 || filters.minCents != null || filters.maxCents != null || filters.inStockOnly
  const clearHref = scope.q ? `${basePath}?q=${encodeURIComponent(scope.q)}` : basePath

  const bar = (
    <>
      <span aria-live="polite">
        {products.length} {products.length === 1 ? 'suit' : 'suits'}
      </span>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="sr-only">Sort by</span>
        <select name="sort" className="select" defaultValue={filters.sort}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </>
  )

  const panel = (
    <div className="filters">
      {scope.q && <input type="hidden" name="q" value={scope.q} />}
      {facets.categories.length > 1 && (
        <details className="filter-group" open>
          <summary>Suit type</summary>
          <div className="filter-options">
            <label className="check">
              <input type="radio" name="category" value="" defaultChecked={!filters.category} />
              All suits
            </label>
            {facets.categories.map((c) => (
              <label key={c.slug} className="check">
                <input type="radio" name="category" value={c.slug} defaultChecked={filters.category === c.slug} />
                <span>
                  {c.name} <span className="muted">({c.count})</span>
                </span>
              </label>
            ))}
          </div>
        </details>
      )}
      {facets.colours.length > 1 && (
        <details className="filter-group" open>
          <summary>Colour</summary>
          <div className="filter-options">
            {facets.colours.map((c) => (
              <label key={c.id} className="check">
                <input type="checkbox" name="colour" value={c.id} defaultChecked={filters.colours?.includes(c.id)} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                  <span className="dot" style={{ background: c.hex }} aria-hidden />
                  {c.label}
                </span>
              </label>
            ))}
          </div>
        </details>
      )}
      {facets.sizes.length > 0 && (
        <details className="filter-group" open>
          <summary>Size</summary>
          <div className="filter-sizes">
            {facets.sizes.map((size) => (
              <label key={size} className="sizecheck">
                <input type="checkbox" name="size" value={size} defaultChecked={filters.sizes?.includes(size)} />
                <span>{size}</span>
              </label>
            ))}
          </div>
        </details>
      )}
      {facets.priceRange && (
        <details className="filter-group" open>
          <summary>Price (R)</summary>
          <div className="filter-options" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">
              <span className="sr-only">Minimum price in Rand</span>
              <input className="input" name="min" inputMode="numeric" placeholder={`From ${Math.floor(facets.priceRange.minCents / 100)}`} defaultValue={one(searchParams.min)} />
            </label>
            <label className="field">
              <span className="sr-only">Maximum price in Rand</span>
              <input className="input" name="max" inputMode="numeric" placeholder={`To ${Math.ceil(facets.priceRange.maxCents / 100)}`} defaultValue={one(searchParams.max)} />
            </label>
          </div>
        </details>
      )}
      {facets.anyInStock && (
        <div className="filter-group">
          <label className="check">
            <input type="checkbox" name="stock" value="1" defaultChecked={filters.inStockOnly} />
            In stock only
          </label>
        </div>
      )}
      <div className="actions" style={{ paddingTop: 18 }}>
        <button type="submit" className="btn btn-line btn-sm">
          Apply filters
        </button>
        {active && (
          <Link href={clearHref} className="link" style={{ fontSize: '0.84rem' }}>
            Clear all
          </Link>
        )}
      </div>
    </div>
  )

  return (
    // The panel is remounted when filters are cleared so that its checkboxes reset.
    <FiltersForm basePath={basePath} bar={bar} panel={<div key={active ? 'filtered' : 'clear'}>{panel}</div>}>
      {products.length > 0 ? (
        <ProductGrid products={products} four={false} />
      ) : (
        <div className="empty">
          <h2 className="display-sm">{emptyMessage ?? 'No suits match those filters.'}</h2>
          <p className="soft">Try removing a filter, or tell us what you are looking for and we will check what we have in store.</p>
          <div className="actions">
            <Link href={clearHref} className="btn btn-line">
              Clear filters
            </Link>
            <WhatsAppButton message={waMessages.recommend()}>Ask us on WhatsApp</WhatsAppButton>
          </div>
        </div>
      )}
    </FiltersForm>
  )
}
