import Image from 'next/image'
import Link from 'next/link'
import { HeroShowcase } from '@/components/HeroShowcase'
import { Paragraphs } from '@/components/Markdown'
import { OccasionIndex } from '@/components/OccasionIndex'
import { ProductCard } from '@/components/ProductCard'
import { Reveal } from '@/components/Reveal'
import { WhatsAppButton } from '@/components/WhatsApp'
import { IconCalendar } from '@/components/icons'
import { listFlagged, listProducts } from '@/lib/catalog'
import { getContents } from '@/lib/content'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'
import { addressLines, getSettings } from '@/lib/settings'
import { telLink, waMessages } from '@/lib/whatsapp'

const FITTING_STEPS = [
  { title: 'Consultation', text: 'We start with you: the occasion, your style and how you want to feel when you walk in.' },
  { title: 'Fitting', text: 'You try the suit on and we check the shoulders, sleeves, waist and trouser length together.' },
  { title: 'Adjustments', text: 'We assess what needs altering and confirm the details with you before anything is changed.' },
  { title: 'Final fitting', text: 'You try it on once more, we finish the look with accessories, and you leave ready.' },
]

// What we look at in a suit, in three words. The detail lives on the Fabrics & craftsmanship page.
const CRAFT = [
  { title: 'Cloth', text: 'How it drapes on the hanger, how it feels in the hand and how it recovers from a crease.' },
  { title: 'Cut', text: 'A shoulder that sits flat, a chest that lies clean and a lapel that rolls rather than folds.' },
  { title: 'Finish', text: 'Buttons sewn firmly, pockets that lie flat and patterns that meet cleanly at the seams.' },
]

export default async function HomePage() {
  const [settings, content, featured, newArrivals, bestSellers, testimonials] = await Promise.all([
    getSettings(),
    getContents(['home.intro', 'home.story', 'home.craft', 'home.fitting']),
    listFlagged('isFeatured', 8),
    listFlagged('isNewArrival', 4),
    listFlagged('isBestSeller', 4),
    db.testimonial.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 3 }),
  ])
  const pool = featured.length >= 3 ? featured : await listProducts({}, 8)
  // The hero shows three suits one at a time; the collection row below shows the next four, so nothing repeats.
  const showcase = pool.filter((p) => p.image).slice(0, 3)
  const collection = pool.filter((p) => !showcase.includes(p)).slice(0, 4)
  const hours = settings.hours.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <>
      <section className="hero marble">
        <div className="hero-emblem" aria-hidden />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1 className="sign hero-title foil">
              <span>Command the room.</span>
              <span>Define your presence.</span>
            </h1>
            <p className="lede hero-lede">
              Discover distinctive menswear for the moments that matter. From the boardroom to life’s defining celebrations, dress with confidence and distinction.
            </p>
            <div className="actions">
              <Link href="/shop" className="btn btn-gold">
                Explore the collection
              </Link>
              <Link href="/book" className="textlink">
                Book a private fitting
              </Link>
            </div>
          </div>
          <HeroShowcase items={showcase.map((p) => ({ slug: p.slug, name: p.name, price: p.priceCents != null ? formatZAR(p.priceCents) : null, image: p.image! }))} />
        </div>
        <div className="floorlight" aria-hidden />
      </section>

      {/* Brand introduction, set as the brushed-gold plaque from the store. */}
      <section className="plaque" aria-label="About MEN EXCLUSIVE">
        <div className="wrap plaque-inner">
          <div className="plaque-emblem" aria-hidden />
          <div className="plaque-text">
            <Paragraphs text={content['home.intro']} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="head">
            <div className="head-text">
              <h2 className="display">Dressed for the occasion</h2>
              <p className="soft">Tell us where you are going and we will show you what to wear.</p>
            </div>
          </Reveal>
          <Reveal>
            <OccasionIndex />
          </Reveal>
        </div>
      </section>

      {collection.length > 0 && (
        <section className="section on-coal rule-top">
          <div className="wrap">
            <Reveal className="head">
              <div className="head-text">
                <h2 className="display">The featured collection</h2>
              </div>
              <Link href="/shop" className="textlink">
                View collection
              </Link>
            </Reveal>
            <Reveal className="grid grid-4">
              {collection.map((p) => (
                <ProductCard key={p.id} product={p} sizes="(min-width: 1100px) 34vw, (min-width: 760px) 46vw, 70vw" />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="section rule-top">
          <div className="wrap">
            <Reveal className="head">
              <h2 className="display">New arrivals</h2>
              <Link href="/shop?sort=newest" className="textlink">
                Shop now
              </Link>
            </Reveal>
            <Reveal className="grid grid-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="section on-coal rule-top">
          <div className="wrap">
            <Reveal className="head">
              <h2 className="display">Best sellers</h2>
              <Link href="/shop" className="textlink">
                Shop now
              </Link>
            </Reveal>
            <Reveal className="grid grid-4">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* Signature brand story */}
      <section className="section rule-top">
        <div className="wrap story">
          <Reveal className="story-mark">
            <Image src="/brand/emblem-gold.webp" alt="The MEN EXCLUSIVE emblem: the face of a big cat, in gold" width={512} height={512} />
          </Reveal>
          <Reveal className="story-text">
            <h2 className="display">Power in presence. Elegance in detail.</h2>
            <div className="stack lede">
              <Paragraphs text={content['home.story']} />
            </div>
            <Link href="/our-story" className="textlink">
              Read our story
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Fabrics and craftsmanship, in words rather than photographs */}
      <section className="section on-coal rule-top">
        <div className="wrap">
          <Reveal className="head">
            <div className="head-text">
              <h2 className="display">Cloth, cut and finish</h2>
              <div className="soft">
                <Paragraphs text={content['home.craft']} />
              </div>
            </div>
            <Link href="/fabrics-craftsmanship" className="textlink">
              Fabrics and craftsmanship
            </Link>
          </Reveal>
          <Reveal className="trio">
            {CRAFT.map((c) => (
              <div key={c.title} className="trio-item">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* The fitting experience */}
      <section className="section rule-top">
        <div className="wrap">
          <Reveal className="head">
            <div className="head-text">
              <h2 className="display">The fitting experience</h2>
              <div className="soft">
                <Paragraphs text={content['home.fitting']} />
              </div>
            </div>
          </Reveal>
          <Reveal>
            <ol className="steps steps-cols">
              {FITTING_STEPS.map((s) => (
                <li key={s.title}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="actions" style={{ marginTop: 40 }}>
              <Link href="/book" className="btn btn-gold">
                <IconCalendar />
                Book a private fitting
              </Link>
              <WhatsAppButton message={waMessages.fitting()}>Request a fitting on WhatsApp</WhatsAppButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Testimonials appear once the store has published some in the admin. */}
      {testimonials.length > 0 && (
        <section className="section on-coal rule-top">
          <div className="wrap">
            <Reveal className="head">
              <h2 className="display">In our clients’ words</h2>
            </Reveal>
            <Reveal className="testimonials">
              {testimonials.map((t) => (
                <figure key={t.id} className="testimonial">
                  <blockquote className="quote">“{t.quote}”</blockquote>
                  <figcaption className="soft">
                    <strong style={{ color: 'var(--text)' }}>{t.name}</strong>
                    {t.context && <div className="muted">{t.context}</div>}
                  </figcaption>
                </figure>
              ))}
            </Reveal>
          </div>
        </section>
      )}

      {/* Store information and WhatsApp */}
      <section className="section marble rule-top">
        <div className="wrap">
          <Reveal className="head">
            <div className="head-text">
              <h2 className="display">Visit us in Johannesburg</h2>
              <p className="soft">Try on in store, or message us and we will help you from wherever you are.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="infogrid">
              <div className="info">
                <h3>Find us</h3>
                <address>
                  {addressLines(settings).map((l) => (
                    <div key={l}>{l}</div>
                  ))}
                </address>
                {settings.mapUrl && (
                  <p>
                    <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="link">
                      Get directions
                    </a>
                  </p>
                )}
              </div>
              <div className="info">
                <h3>{hours.length > 0 ? 'Opening hours' : 'Before you visit'}</h3>
                {hours.length > 0 ? hours.map((h) => <p key={h}>{h}</p>) : <p>Message or call us to check when we are open, or book a time that suits you.</p>}
              </div>
              <div className="info">
                <h3>Talk to us</h3>
                {settings.phone && (
                  <p>
                    <a href={telLink(settings.phone)}>{settings.phone}</a>
                  </p>
                )}
                {settings.email && (
                  <p>
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  </p>
                )}
              </div>
            </div>
            <div className="actions" style={{ marginTop: 40 }}>
              <WhatsAppButton message={waMessages.general()} className="btn btn-gold">
                Chat to us on WhatsApp
              </WhatsAppButton>
              <Link href="/contact" className="btn btn-line">
                Contact the store
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
