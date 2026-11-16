import Image from 'next/image'
import Link from 'next/link'
import { Paragraphs } from '@/components/Markdown'
import { ProductCard, ProductGrid } from '@/components/ProductCard'
import { WhatsAppButton } from '@/components/WhatsApp'
import { IconCalendar } from '@/components/icons'
import { listFlagged, listProducts } from '@/lib/catalog'
import { getContents } from '@/lib/content'
import { db } from '@/lib/db'
import { formatZAR } from '@/lib/money'
import { addressLines, getSettings } from '@/lib/settings'
import { telLink, waMessages } from '@/lib/whatsapp'

async function occasionTiles() {
  const occasions = await db.occasion.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
      products: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        take: 8,
        select: { id: true, images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } } },
      },
    },
  })
  // Give each occasion a different photograph where possible.
  const used = new Set<string>()
  return occasions.map((o) => {
    const pick = o.products.find((p) => p.images[0] && !used.has(p.id)) ?? o.products.find((p) => p.images[0])
    if (pick) used.add(pick.id)
    return { slug: o.slug, name: o.name, count: o._count.products, image: pick?.images[0]?.url ?? null }
  })
}

const FITTING_STEPS = [
  { title: 'Consultation', text: 'We start with you: the occasion, your style and how you want to feel when you walk in.' },
  { title: 'Fitting', text: 'You try the suit on and we check the shoulders, sleeves, waist and trouser length together.' },
  { title: 'Adjustments', text: 'We assess what needs altering and confirm the details with you before anything is changed.' },
  { title: 'Final fitting', text: 'You try it on once more, we finish the look with accessories, and you leave ready.' },
]

export default async function HomePage() {
  const [settings, content, featured, newArrivals, bestSellers, tiles, testimonials] = await Promise.all([
    getSettings(),
    getContents(['home.intro', 'home.story', 'home.craft', 'home.fitting']),
    listFlagged('isFeatured', 8),
    listFlagged('isNewArrival', 8),
    listFlagged('isBestSeller', 8),
    occasionTiles(),
    db.testimonial.findMany({ where: { isPublished: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], take: 6 }),
  ])
  const showcase = featured.length >= 3 ? featured : await listProducts({}, 8)
  const windowItems = showcase.filter((p) => p.image).slice(0, 3)
  const craftImage = showcase.find((p) => /check|windowpane/i.test(p.name))?.image ?? showcase[3]?.image
  const hours = settings.hours.split('\n').map((l) => l.trim()).filter(Boolean)

  return (
    <>
      {/* Hero: the headline, and three suits standing in the window. */}
      <section className="hero marble">
        <div className="hero-emblem" aria-hidden />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1 className="sign hero-title foil">
              <span>Command the room.</span>
              <span>Define your presence.</span>
            </h1>
            <p className="lede" style={{ color: 'var(--champagne)' }}>
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
          {windowItems.length > 0 && (
            <div className="window">
              {windowItems.map((p, i) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="window-item">
                  <Image src={p.image!.url} alt={p.image!.alt} width={p.image!.width} height={p.image!.height} sizes="(min-width: 900px) 20vw, 34vw" priority={i < 3} />
                  <span className="window-cap">
                    <b>{p.name}</b>
                    <span>{p.priceCents != null ? formatZAR(p.priceCents) : 'View suit'}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
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

      {/* Shop by occasion */}
      {tiles.length > 0 && (
        <section className="section">
          <div className="wrap">
            <div className="head">
              <div className="head-text">
                <h2 className="display">Dressed for the occasion</h2>
                <p className="soft">Tell us where you are going and we will show you what to wear.</p>
              </div>
              <Link href="/occasions" className="textlink">
                All occasions
              </Link>
            </div>
            <div className="occasions">
              {tiles.map((t) => (
                <Link key={t.slug} href={`/occasions/${t.slug}`} className="occasion">
                  {t.image && <Image src={t.image} alt="" fill sizes="(min-width: 900px) 25vw, 50vw" />}
                  <span className="occasion-cap">
                    <span className="occasion-name">{t.name}</span>
                    <span className="occasion-meta">{t.count > 0 ? `${t.count} ${t.count === 1 ? 'suit' : 'suits'}` : 'Ask us for options'}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured collection */}
      {featured.length > 0 && (
        <section className="section on-coal rule-top">
          <div className="wrap">
            <div className="head">
              <div className="head-text">
                <h2 className="display">The featured collection</h2>
              </div>
              <Link href="/shop" className="btn btn-line">
                View collection
              </Link>
            </div>
            <ProductGrid products={featured} />
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="section rule-top">
          <div className="wrap">
            <div className="head">
              <h2 className="display">New arrivals</h2>
              <Link href="/shop?sort=newest" className="btn btn-line">
                Shop now
              </Link>
            </div>
            <div className="rail">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} sizes="300px" />
              ))}
            </div>
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section className="section on-coal rule-top">
          <div className="wrap">
            <div className="head">
              <h2 className="display">Best sellers</h2>
              <Link href="/shop" className="btn btn-line">
                Shop now
              </Link>
            </div>
            <div className="rail">
              {bestSellers.map((p) => (
                <ProductCard key={p.id} product={p} sizes="300px" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Signature brand story */}
      <section className="section marble rule-top">
        <div className="wrap split">
          <div>
            <Image src="/brand/emblem-gold.webp" alt="The MEN EXCLUSIVE emblem: the face of a big cat, in gold" width={512} height={512} className="emblem-gold" />
          </div>
          <div className="split-text">
            <h2 className="display">Power in presence. Elegance in detail.</h2>
            <div className="stack lede">
              <Paragraphs text={content['home.story']} />
            </div>
            <Link href="/our-story" className="textlink">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* Fabrics and craftsmanship */}
      <section className="section on-coal rule-top">
        <div className="wrap split split-flip">
          {craftImage && (
            <div className="split-media">
              <Image src={craftImage.url} alt={craftImage.alt} fill sizes="(min-width: 900px) 50vw, 100vw" style={{ objectPosition: '68% 46%', transform: 'scale(1.5)' }} />
            </div>
          )}
          <div className="split-text">
            <h2 className="display">Cloth, cut and finish</h2>
            <div className="stack lede">
              <Paragraphs text={content['home.craft']} />
            </div>
            <Link href="/fabrics-craftsmanship" className="textlink">
              Fabrics and craftsmanship
            </Link>
          </div>
        </div>
      </section>

      {/* The fitting experience */}
      <section className="section rule-top">
        <div className="wrap">
          <div className="head">
            <div className="head-text">
              <h2 className="display">The fitting experience</h2>
              <div className="soft">
                <Paragraphs text={content['home.fitting']} />
              </div>
            </div>
          </div>
          <ol className="steps steps-cols" style={{ gridTemplateColumns: undefined }}>
            {FITTING_STEPS.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="actions" style={{ marginTop: 36 }}>
            <Link href="/book" className="btn btn-gold">
              <IconCalendar />
              Book a private fitting
            </Link>
            <WhatsAppButton message={waMessages.fitting()}>Request a fitting on WhatsApp</WhatsAppButton>
          </div>
        </div>
      </section>

      {/* Testimonials appear once the store has published some in the admin. */}
      {testimonials.length > 0 && (
        <section className="section on-coal rule-top">
          <div className="wrap">
            <div className="head">
              <h2 className="display">In our clients’ words</h2>
            </div>
            <div className="testimonials">
              {testimonials.map((t) => (
                <figure key={t.id} className="testimonial">
                  <blockquote className="quote">“{t.quote}”</blockquote>
                  <figcaption className="soft">
                    <strong style={{ color: 'var(--text)' }}>{t.name}</strong>
                    {t.context && <div className="muted">{t.context}</div>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Store information and WhatsApp */}
      <section className="section marble rule-top">
        <div className="wrap">
          <div className="head">
            <div className="head-text">
              <h2 className="display">Visit us in Johannesburg</h2>
              <p className="soft">Try on in store, or message us and we will help you from wherever you are.</p>
            </div>
          </div>
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
          <div className="actions" style={{ marginTop: 36 }}>
            <WhatsAppButton message={waMessages.general()} className="btn btn-gold">
              Chat to us on WhatsApp
            </WhatsAppButton>
            <Link href="/contact" className="btn btn-line">
              Contact the store
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
