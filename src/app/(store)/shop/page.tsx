import type { Metadata } from 'next'
import { Crumbs } from '@/components/JsonLd'
import { ShopListing, type RawSearchParams } from '@/components/shop/ShopListing'

export const metadata: Metadata = {
  title: "Shop men's suits online in South Africa",
  description:
    "Shop men's suits from MEN EXCLUSIVE, Johannesburg: three-piece, double-breasted and single-breasted suits for work, weddings, matric dances and graduations. Prices in Rand, secure payment by Yoco.",
  alternates: { canonical: '/shop' },
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams
  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Shop suits' }]} />
        <h1 className="display">Shop suits</h1>
        <p className="lede">Three-piece, double-breasted and single-breasted suits, photographed in our Johannesburg store.</p>
      </header>
      <section style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <ShopListing basePath="/shop" searchParams={sp} />
      </section>
    </div>
  )
}
