import Link from 'next/link'
import { POLICY_PAGES } from '@/lib/constants'
import { addressLines, getSettings } from '@/lib/settings'
import { telLink } from '@/lib/whatsapp'
import { NewsletterForm } from './NewsletterForm'

export async function Footer() {
  const s = await getSettings()
  const social = [
    { href: s.instagram, label: 'Instagram' },
    { href: s.facebook, label: 'Facebook' },
    { href: s.tiktok, label: 'TikTok' },
  ].filter((x) => /^https:\/\//.test(x.href))

  return (
    <footer className="footer on-coal">
      <div className="wrap footer-top">
        <p className="footer-line">Power in presence. Elegance in detail. Distinction in every occasion.</p>
      </div>
      <div className="wrap footer-grid">
        <div>
          <h2>Visit the store</h2>
          <address style={{ fontStyle: 'normal' }}>
            {addressLines(s).map((line) => (
              <div key={line}>{line}</div>
            ))}
          </address>
          <ul style={{ marginTop: 14 }}>
            {s.phone && (
              <li>
                <a href={telLink(s.phone)}>{s.phone}</a>
              </li>
            )}
            {s.email && (
              <li>
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </li>
            )}
            {s.mapUrl && (
              <li>
                <a href={s.mapUrl} target="_blank" rel="noopener noreferrer" className="link">
                  Get directions
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h2>Shop</h2>
          <ul>
            <li>
              <Link href="/shop">All suits</Link>
            </li>
            <li>
              <Link href="/occasions">Shop by occasion</Link>
            </li>
            <li>
              <Link href="/search">Search</Link>
            </li>
            <li>
              <Link href="/cart">Your bag</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2>Service</h2>
          <ul>
            <li>
              <Link href="/book">Book an appointment</Link>
            </li>
            <li>
              <Link href="/fittings-alterations">Fittings and alterations</Link>
            </li>
            <li>
              <Link href="/fabrics-craftsmanship">Fabrics and craftsmanship</Link>
            </li>
            <li>
              <Link href="/our-story">Our story</Link>
            </li>
            <li>
              <Link href="/contact">Contact us</Link>
            </li>
            <li>
              <Link href="/account">Your account</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2>Policies</h2>
          <ul>
            {POLICY_PAGES.map((p) => (
              <li key={p.slug}>
                <Link href={`/policies/${p.slug}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Newsletter</h2>
          <NewsletterForm />
          {social.length > 0 && (
            <ul style={{ display: 'flex', gap: 18, marginTop: 18 }}>
              {social.map((x) => (
                <li key={x.label} style={{ marginTop: 0 }}>
                  <a href={x.href} target="_blank" rel="noopener noreferrer">
                    {x.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="wrap footer-base">
        <span>
          © {new Date().getFullYear()} {s.legalName || s.storeName}
          {s.registrationNumber ? `, Reg. ${s.registrationNumber}` : ''}. All rights reserved.
        </span>
        <span>Prices in South African Rand (ZAR). Secure payments by Yoco.</span>
      </div>
    </footer>
  )
}
