import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Crumbs } from '@/components/JsonLd'
import { Markdown } from '@/components/Markdown'
import { WhatsAppButton } from '@/components/WhatsApp'
import { listProducts } from '@/lib/catalog'
import { getContents } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Fabrics and craftsmanship: what makes a good suit',
  description: 'How to judge a suit by its cloth, structure, lining, buttons and finishing, how MEN EXCLUSIVE fits a suit to you, and how to care for it.',
  alternates: { canonical: '/fabrics-craftsmanship' },
}

// The service journey described in the MEN EXCLUSIVE company profile.
const PROCESS = [
  { title: 'Consultation and styling', text: 'We begin with a personal consultation to understand your style, your preferences and the occasion, and guide you on colours and cuts.' },
  { title: 'Measurement and fitting', text: 'We check your measurements and the fit of the suit on you, so that comfort, posture and proportion are right.' },
  { title: 'Cloth and colour', text: 'You choose the cloth, colour and pattern that set the tone you want, with our advice on what suits you and the event.' },
  { title: 'Tailoring and adjustments', text: 'Any adjustments are assessed and carried out with attention to detail, so the suit sits as it should.' },
  { title: 'Final fitting', text: 'You try the finished suit on. We add accessories and styling tips so that it is worn with confidence.' },
]

export default async function FabricsPage() {
  const [content, products] = await Promise.all([getContents(['fabrics.intro', 'fabrics.body', 'fabrics.care']), listProducts({}, 40)])
  const patterned = products.filter((p) => p.image && /check|windowpane/i.test(p.name))
  const plain = products.filter((p) => p.image && !/check|windowpane/i.test(p.name))
  const closeUps = [patterned[0], plain[1] ?? plain[0], patterned[1] ?? plain[2]].filter(Boolean)

  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Fabrics and craftsmanship' }]} />
        <h1 className="display">Fabrics and craftsmanship</h1>
        <p className="lede">{content['fabrics.intro']}</p>
      </header>

      {closeUps.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${closeUps.length}, minmax(0, 1fr))`, gap: 'clamp(8px, 1.4vw, 18px)' }}>
          {closeUps.map((p) => (
            <Link key={p.id} href={`/shop/${p.slug}`} className="split-media" style={{ aspectRatio: '1 / 1.1' }} aria-label={`${p.name}: view suit`}>
              {/* Close crops of our own product photographs, so the cloth is what you see. */}
              <Image src={p.image!.url} alt={`Close view of the ${p.name.toLowerCase()}`} fill sizes="33vw" style={{ objectPosition: '66% 44%', transform: 'scale(1.9)' }} />
            </Link>
          ))}
        </div>
      )}

      <section className="section">
        <div className="split" style={{ alignItems: 'start' }}>
          <Markdown source={content['fabrics.body']} />
          <aside className="stack-lg" style={{ position: 'sticky', top: 'calc(var(--header-h) + 70px)' }}>
            <div className="pathcard">
              <h3>Caring for your suit</h3>
              <Markdown source={content['fabrics.care']} />
            </div>
            <div className="pathcard">
              <h3>Want to know what a suit is made of?</h3>
              <p>Fabric and care details are listed on the product page where we have confirmed them. For anything else, ask and we will check the label for you.</p>
              <div style={{ marginTop: 6 }}>
                <WhatsAppButton message="Good day. I would like to know more about the fabric and care of one of your suits.">Ask about a fabric</WhatsAppButton>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="section rule-top">
        <div className="head">
          <div className="head-text">
            <h2 className="display">From first conversation to final fitting</h2>
            <p className="soft">A suit is finished when it fits you. This is how we get there together.</p>
          </div>
        </div>
        <ol className="steps steps-cols">
          {PROCESS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="actions" style={{ marginTop: 36 }}>
          <Link href="/book" className="btn btn-gold">
            Book a private fitting
          </Link>
          <Link href="/shop" className="btn btn-line">
            View collection
          </Link>
        </div>
      </section>
    </div>
  )
}
