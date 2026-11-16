import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Crumbs } from '@/components/JsonLd'
import { WhatsAppButton } from '@/components/WhatsApp'
import { db } from '@/lib/db'
import { waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Shop suits by occasion: weddings, matric dance, graduation, corporate',
  description:
    'Find the right suit for the occasion: corporate and business, matric dance, graduation, weddings, formal and black tie, business travel and special occasions. MEN EXCLUSIVE, Johannesburg.',
  alternates: { canonical: '/occasions' },
}

export default async function OccasionsPage() {
  const occasions = await db.occasion.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
      products: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 8, select: { id: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } } },
    },
  })
  const used = new Set<string>()
  const tiles = occasions.map((o) => {
    const pick = o.products.find((p) => p.images[0] && !used.has(p.id)) ?? o.products.find((p) => p.images[0])
    if (pick) used.add(pick.id)
    return { ...o, image: pick?.images[0]?.url ?? null }
  })

  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Shop by occasion' }]} />
        <h1 className="display">Shop by occasion</h1>
        <p className="lede">You do not need to know suits to choose a good one. Start with where you are going, and we will show you what works.</p>
      </header>
      <div className="occasions" style={{ paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
        {tiles.map((o) => (
          <Link key={o.slug} href={`/occasions/${o.slug}`} className="occasion">
            {o.image && <Image src={o.image} alt="" fill sizes="(min-width: 900px) 25vw, 50vw" />}
            <span className="occasion-cap">
              <span className="occasion-name">{o.name}</span>
              <span className="occasion-meta">{o._count.products > 0 ? `${o._count.products} ${o._count.products === 1 ? 'suit' : 'suits'}` : 'Ask us for options'}</span>
            </span>
          </Link>
        ))}
      </div>
      <section className="section-tight rule-top">
        <div className="stack" style={{ maxWidth: 620 }}>
          <h2 className="display-sm">Not sure which suit fits the event?</h2>
          <p className="soft">Tell us the occasion, the date and what you like. We will recommend options and check your size.</p>
          <div className="actions">
            <WhatsAppButton message={waMessages.recommend()} className="btn btn-gold">
              Get a recommendation
            </WhatsAppButton>
            <Link href="/book" className="btn btn-line">
              Book a styling appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
