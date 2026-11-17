import type { Metadata } from 'next'
import { Crumbs } from '@/components/JsonLd'
import { ShopListing, type RawSearchParams } from '@/components/shop/ShopListing'

export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } }

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 80) ?? ''
  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Search' }]} />
        <h1 className="display">{q ? `Results for “${q}”` : 'Search the store'}</h1>
        <form action="/search" method="get" role="search" className="newsletter" style={{ maxWidth: 520 }}>
          <label htmlFor="search-q" className="sr-only">
            Search
          </label>
          <input id="search-q" type="search" name="q" defaultValue={q} placeholder="Search suits, colours, occasions" enterKeyHint="search" />
          <button type="submit">Search</button>
        </form>
      </header>
      <section style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        {q ? (
          <ShopListing basePath="/search" searchParams={sp} scope={{ q }} emptyMessage={`Nothing matched “${q}”.`} />
        ) : (
          <p className="soft">Type a colour, a style or an occasion, such as “navy”, “double-breasted” or “wedding”.</p>
        )}
      </section>
    </div>
  )
}
