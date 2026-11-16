import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Crumbs } from '@/components/JsonLd'
import { Markdown } from '@/components/Markdown'
import { POLICY_PAGES } from '@/lib/constants'
import { getContent } from '@/lib/content'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = POLICY_PAGES.find((p) => p.slug === slug)
  if (!page) return { title: 'Page not found' }
  return { title: page.title, description: `${page.title} for the MEN EXCLUSIVE online store, South Africa.`, alternates: { canonical: `/policies/${slug}` } }
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params
  const page = POLICY_PAGES.find((p) => p.slug === slug)
  if (!page) notFound()
  const body = await getContent(`policy.${slug}`)
  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: page.title }]} />
        <h1 className="display">{page.title}</h1>
      </header>
      <div className="shop" style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <nav aria-label="Policies" className="filters-panel" data-open="true">
          <ul className="stack" style={{ gap: 12 }}>
            {POLICY_PAGES.map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`} className={p.slug === slug ? 'gold' : 'soft'} aria-current={p.slug === slug ? 'page' : undefined}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Markdown source={body} />
      </div>
    </div>
  )
}
