import type { Metadata } from 'next'
import Link from 'next/link'
import { Crumbs } from '@/components/JsonLd'
import { OccasionIndex } from '@/components/OccasionIndex'
import { WhatsAppButton } from '@/components/WhatsApp'
import { waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Shop suits by occasion: weddings, matric dance, graduation, corporate',
  description:
    'Find the right suit for the occasion: corporate and business, matric dance, graduation, weddings, formal and black tie, business travel and special occasions. MEN EXCLUSIVE, Johannesburg.',
  alternates: { canonical: '/occasions' },
}

export default function OccasionsPage() {
  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Shop by occasion' }]} />
        <h1 className="display">Shop by occasion</h1>
        <p className="lede">You do not need to know suits to choose a good one. Start with where you are going, and we will show you what works.</p>
      </header>
      <div style={{ paddingBottom: 'clamp(48px, 7vw, 96px)' }}>
        <OccasionIndex />
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
