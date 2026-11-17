import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Crumbs, JsonLd } from '@/components/JsonLd'
import { Markdown } from '@/components/Markdown'
import { ShopListing, type RawSearchParams } from '@/components/shop/ShopListing'
import { WhatsAppButton } from '@/components/WhatsApp'
import { getOccasion } from '@/lib/catalog'
import { breadcrumbJsonLd } from '@/lib/seo'
import { waMessages } from '@/lib/whatsapp'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const occasion = await getOccasion(slug)
  if (!occasion) return { title: 'Occasion not found' }
  return {
    title: occasion.seoTitle || `${occasion.name} suits for men`,
    description: occasion.seoDesc || `${occasion.tagline} ${occasion.intro}`.slice(0, 158),
    alternates: { canonical: `/occasions/${occasion.slug}` },
  }
}

export default async function OccasionPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const occasion = await getOccasion(slug)
  if (!occasion) notFound()
  const lower = occasion.name.toLowerCase()
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Shop by occasion', path: '/occasions' },
    { name: occasion.name, path: `/occasions/${occasion.slug}` },
  ]
  const message = occasion.slug === 'weddings' ? waMessages.wedding() : occasion.slug === 'corporate-business' ? waMessages.corporate() : waMessages.recommend(`a ${lower} event`)

  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={crumbs} />
        <h1 className="display">{occasion.name}</h1>
        <p className="quote" style={{ maxWidth: '30em' }}>
          {occasion.tagline}
        </p>
        <p className="lede">{occasion.intro}</p>
      </header>

      <section style={{ paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
        <ShopListing basePath={`/occasions/${occasion.slug}`} searchParams={sp} scope={{ occasion: occasion.slug }} emptyMessage="We are still adding suits for this occasion." />
      </section>

      <section className="section-tight rule-top">
        <div className="split" style={{ alignItems: 'start' }}>
          {occasion.stylingNotes && (
            <div className="stack">
              <h2 className="display-sm">How to wear it</h2>
              <Markdown source={occasion.stylingNotes} />
            </div>
          )}
          <div className="pathcard">
            <h3>Want a second opinion?</h3>
            <p>Tell us about the event and we will recommend suits, check sizes and help you finish the look.</p>
            <div className="actions" style={{ marginTop: 6 }}>
              <WhatsAppButton message={message} className="btn btn-gold">
                Ask on WhatsApp
              </WhatsAppButton>
              <Link href="/book" className="btn btn-line">
                Book a fitting
              </Link>
            </div>
          </div>
        </div>
      </section>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  )
}
