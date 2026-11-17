import type { Metadata } from 'next'
import Link from 'next/link'
import { Crumbs } from '@/components/JsonLd'
import { Markdown } from '@/components/Markdown'
import { WhatsAppButton } from '@/components/WhatsApp'
import { IconCalendar } from '@/components/icons'
import { getContents } from '@/lib/content'
import { waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Suit fittings and alterations in Johannesburg',
  description: 'Fittings, adjustments and personal styling at MEN EXCLUSIVE, Johannesburg. Request an alteration assessment on WhatsApp or book a private fitting.',
  alternates: { canonical: '/fittings-alterations' },
}

export default async function FittingsPage() {
  const content = await getContents(['fittings.intro', 'fittings.services', 'fittings.note'])
  return (
    <>
      <section className="marble">
        <div className="wrap pagehead" style={{ paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
          <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Fittings and alterations' }]} />
          <h1 className="display">Fittings and alterations</h1>
          <p className="lede" style={{ color: 'var(--champagne)' }}>
            {content['fittings.intro']}
          </p>
          <div className="actions" style={{ marginTop: 8 }}>
            <Link href="/book?purpose=Fitting" className="btn btn-gold">
              <IconCalendar />
              Book a fitting
            </Link>
            <WhatsAppButton message={waMessages.alteration()}>Request an alteration assessment</WhatsAppButton>
          </div>
        </div>
        <div className="floorlight" aria-hidden />
      </section>

      <section className="section">
        <div className="wrap">
          <div className="head">
            <div className="head-text">
              <h2 className="display">Three ways to get the right fit</h2>
              <p className="soft">Not every suit needs altering, and not every alteration is the same.</p>
            </div>
          </div>
          <div className="cards3">
            <div className="pathcard">
              <h3>Ready to wear</h3>
              <p>Choose your size and wear it as it is. If you are between sizes or unsure, message us before you order and we will help you choose.</p>
              <Link href="/shop" className="textlink" style={{ justifySelf: 'start' }}>
                Shop suits
              </Link>
            </div>
            <div className="pathcard">
              <h3>Ready to wear, adjusted to you</h3>
              <p>Most men need a small adjustment somewhere. Try the suit on in store and we will assess what can be done and confirm the details with you first.</p>
              <Link href="/book?purpose=Alteration%20assessment" className="textlink" style={{ justifySelf: 'start' }}>
                Book an assessment
              </Link>
            </div>
            <div className="pathcard">
              <h3>Something specific in mind</h3>
              <p>Looking for a particular colour, cloth or look, or dressing a whole wedding party? Tell us what you have in mind and we will tell you what is possible.</p>
              <WhatsAppButton message={waMessages.special()} className="textlink" icon={false}>
                Ask us on WhatsApp
              </WhatsAppButton>
            </div>
          </div>
        </div>
      </section>

      <section className="section on-coal rule-top">
        <div className="wrap split" style={{ alignItems: 'start' }}>
          <div className="stack">
            <h2 className="display">What we can help with</h2>
            <Markdown source={content['fittings.services']} />
          </div>
          <aside className="stack-lg" style={{ position: 'sticky', top: 'calc(var(--header-h) + 70px)' }}>
            {content['fittings.note'] && (
              <div className="pathcard">
                <h3>Cost and timing</h3>
                <p>{content['fittings.note']}</p>
              </div>
            )}
            <div className="pathcard">
              <h3>Good to know</h3>
              <p>
                A garment altered to your measurements has been personalised for you, so it cannot be returned simply because you changed your mind. Your rights if something is faulty stay the same. See our{' '}
                <Link href="/policies/returns-exchanges" className="link">
                  returns and exchanges policy
                </Link>
                .
              </p>
            </div>
            <div className="actions">
              <Link href="/book?purpose=Fitting" className="btn btn-gold">
                Book a fitting
              </Link>
              <WhatsAppButton message={waMessages.alteration()}>Ask on WhatsApp</WhatsAppButton>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
