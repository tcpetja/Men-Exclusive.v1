import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Crumbs, JsonLd } from '@/components/JsonLd'
import { ProductGrid } from '@/components/ProductCard'
import { ProductBuy } from '@/components/shop/ProductBuy'
import { getProduct, parseSpecs, relatedProducts } from '@/lib/catalog'
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo'
import { getSettings } from '@/lib/settings'
import { waLink, waMessages } from '@/lib/whatsapp'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Suit not found' }
  const description = (product.summary || product.description).slice(0, 155)
  const image = product.images[0]
  return {
    title: product.name,
    description: `${description} Available from MEN EXCLUSIVE, Johannesburg.`,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: image ? [{ url: image.url, width: image.width, height: image.height, alt: image.alt || product.name }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()
  const [settings, related] = await Promise.all([getSettings(), relatedProducts(product)])
  const specs = parseSpecs(product.specs)
  const wa = settings.whatsapp
    ? {
        enquire: waLink(settings.whatsapp, waMessages.product(product.name, product.sku)),
        size: waLink(settings.whatsapp, waMessages.size(product.name, product.sku)),
        price: waLink(settings.whatsapp, waMessages.price(product.name, product.sku)),
      }
    : null
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Shop suits', path: '/shop' },
    ...(product.category ? [{ name: product.category.name, path: `/shop?category=${product.category.slug}` }] : []),
    { name: product.name, path: `/shop/${product.slug}` },
  ]

  return (
    <div className="wrap">
      <div style={{ paddingBlock: 'clamp(18px, 3vw, 32px)' }}>
        <Crumbs items={crumbs} />
      </div>

      <ProductBuy
        wa={wa}
        product={{
          name: product.name,
          sku: product.sku,
          categoryName: product.category?.name ?? null,
          summary: product.summary,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          colours: product.colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex, variants: c.variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock })) })),
          images: product.images.map((i) => ({ url: i.url, alt: i.alt, colourId: i.colourId })),
        }}
      />

      <section className="section-tight" style={{ maxWidth: 820 }}>
        <div className="acc">
          {product.description && (
            <details open>
              <summary>Description</summary>
              <div className="acc-body">
                {product.description.split(/\n\s*\n/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </details>
          )}
          {product.fit && (
            <details>
              <summary>Fit</summary>
              <div className="acc-body">
                <p>{product.fit}</p>
              </div>
            </details>
          )}
          {product.fabric && (
            <details>
              <summary>Fabric</summary>
              <div className="acc-body">
                <p>{product.fabric}</p>
              </div>
            </details>
          )}
          {specs.length > 0 && (
            <details>
              <summary>Specifications</summary>
              <div className="acc-body">
                <dl className="specs">
                  <dt>Reference</dt>
                  <dd>{product.sku}</dd>
                  {specs.map((s, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </details>
          )}
          {product.care && (
            <details>
              <summary>Care</summary>
              <div className="acc-body">
                {product.care.split('\n').filter(Boolean).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </details>
          )}
          <details>
            <summary>Fittings and alterations</summary>
            <div className="acc-body">
              <p>Try this suit on in store and we will assess any adjustments with you. Altered garments are personalised to you, so please confirm your size with us first if you are unsure.</p>
              <p>
                <Link href="/fittings-alterations" className="link">
                  Fittings and alterations
                </Link>
              </p>
            </div>
          </details>
          <details>
            <summary>Delivery, collection and returns</summary>
            <div className="acc-body">
              <p>Your delivery or collection options and any charges are shown at checkout before you pay. Online orders can be cancelled within 7 days of receipt, and faulty items can be returned within 6 months.</p>
              <p>
                <Link href="/policies/delivery" className="link">
                  Delivery and collection
                </Link>
                {' and '}
                <Link href="/policies/returns-exchanges" className="link">
                  returns and exchanges
                </Link>
              </p>
            </div>
          </details>
        </div>
      </section>

      {product.occasions.length > 0 && (
        <section style={{ paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
          <h2 className="caps muted" style={{ marginBottom: 14 }}>
            Wear it to
          </h2>
          <div className="chips">
            {product.occasions.map((o) => (
              <Link key={o.id} href={`/occasions/${o.slug}`} className="chip">
                {o.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="section rule-top">
          <div className="head">
            <h2 className="display-sm">You may also like</h2>
          </div>
          <ProductGrid products={related} />
        </section>
      )}

      <JsonLd data={productJsonLd(product, settings)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
    </div>
  )
}
