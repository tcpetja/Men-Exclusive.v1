import type { ProductDetail } from './catalog'
import { siteUrl, type StoreSettings } from './settings'

export const SEO_DEFAULT_DESCRIPTION =
  "MEN EXCLUSIVE is a Johannesburg menswear boutique for men's suits: corporate, wedding, matric dance, graduation and formalwear, with in-store fittings and alterations. Shop online and pay securely in Rand."

function absolute(path: string) {
  return path.startsWith('http') ? path : siteUrl() + path
}

/** LocalBusiness structured data. Only confirmed details are included. */
export function storeJsonLd(s: StoreSettings) {
  const sameAs = [s.instagram, s.facebook, s.tiktok].filter((u) => /^https:\/\//.test(u))
  return {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': siteUrl() + '/#store',
    name: s.storeName,
    slogan: s.tagline,
    url: siteUrl(),
    image: absolute('/brand/og-default.jpg'),
    logo: absolute('/icon.png'),
    telephone: s.phone || undefined,
    email: s.email || undefined,
    currenciesAccepted: 'ZAR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: [s.building, s.street].filter(Boolean).join(', '),
      addressLocality: s.city,
      addressRegion: s.province,
      postalCode: s.postalCode,
      addressCountry: 'ZA',
    },
    ...(sameAs.length ? { sameAs } : {}),
  }
}

export function productJsonLd(p: ProductDetail, s: StoreSettings) {
  const inStock = p.colours.some((c) => c.variants.some((v) => v.stock > 0))
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    description: p.summary || p.description || undefined,
    image: p.images.map((i) => absolute(i.url)),
    brand: { '@type': 'Brand', name: s.storeName },
    category: p.category?.name,
    color: p.colours.map((c) => c.name).join(', ') || undefined,
    // An offer is only published when the product has a real price.
    ...(p.priceCents != null
      ? {
          offers: {
            '@type': 'Offer',
            url: `${siteUrl()}/shop/${p.slug}`,
            priceCurrency: 'ZAR',
            price: (p.priceCents / 100).toFixed(2),
            availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
            seller: { '@id': siteUrl() + '/#store' },
          },
        }
      : {}),
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: absolute(item.path) })),
  }
}
