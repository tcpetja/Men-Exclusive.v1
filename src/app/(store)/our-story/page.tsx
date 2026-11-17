import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Crumbs } from '@/components/JsonLd'
import { Markdown, Paragraphs } from '@/components/Markdown'
import { getContents } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Our story',
  description: 'MEN EXCLUSIVE is a Johannesburg menswear house built on precision, elegance and timeless style. Read our story, mission and the standard we hold ourselves to.',
  alternates: { canonical: '/our-story' },
}

export default async function OurStoryPage() {
  const content = await getContents(['story.body', 'story.founder', 'story.founderName', 'home.story'])

  return (
    <>
      <section className="marble">
        <div className="wrap split" style={{ paddingBlock: 'clamp(48px, 8vw, 110px)' }}>
          <div className="split-text">
            <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Our story' }]} />
            <h1 className="display">Power in presence. Elegance in detail. Distinction in every occasion.</h1>
            <div className="stack lede">
              <Paragraphs text={content['home.story']} />
            </div>
          </div>
          <div>
            <Image src="/brand/emblem-gold.webp" alt="The MEN EXCLUSIVE emblem: the face of a big cat, in gold" width={512} height={512} className="emblem-gold" priority />
          </div>
        </div>
        <div className="floorlight" aria-hidden />
      </section>

      <section className="section">
        <div className="wrap wrap-narrow">
          <Markdown source={content['story.body']} />
        </div>
      </section>

      {content['story.founder'] && (
        <section className="plaque">
          <div className="wrap plaque-inner" style={{ gridTemplateColumns: undefined }}>
            <div className="plaque-emblem" aria-hidden />
            <figure className="stack">
              <blockquote className="stack" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.1rem, 1.9vw, 1.42rem)', lineHeight: 1.5, maxWidth: '38em' }}>
                <Paragraphs text={content['story.founder']} />
              </blockquote>
              {content['story.founderName'] && <figcaption style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{content['story.founderName']}</figcaption>}
            </figure>
          </div>
        </section>
      )}

      <section className="section">
        <div className="wrap stack" style={{ maxWidth: 700 }}>
          <h2 className="display-sm">See it for yourself</h2>
          <p className="soft">The best way to understand what we do is to try something on.</p>
          <div className="actions">
            <Link href="/shop" className="btn btn-gold">
              Explore the collection
            </Link>
            <Link href="/book" className="btn btn-line">
              Book a private fitting
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
