import type { Metadata } from 'next'
import Link from 'next/link'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Crumbs } from '@/components/JsonLd'
import { WhatsAppButton } from '@/components/WhatsApp'
import { IconChevron } from '@/components/icons'
import { getCurrentUser } from '@/lib/auth'
import { addressLines, getSettings } from '@/lib/settings'
import { telLink, waLink, waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Contact MEN EXCLUSIVE, Johannesburg',
  description: 'Contact MEN EXCLUSIVE at 98 Helen Joseph Street, Johannesburg. Call, email or WhatsApp us about suits, sizes, fittings, alterations, weddings and corporate wardrobes.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])
  const hours = settings.hours.split('\n').map((l) => l.trim()).filter(Boolean)
  const topics = [
    { label: 'Ask about a suit or get a recommendation', message: waMessages.recommend() },
    { label: 'Get help with sizing', message: 'Good day. I would like help choosing the right suit size. Please assist.' },
    { label: 'Request a fitting', message: waMessages.fitting() },
    { label: 'Request an alteration assessment', message: waMessages.alteration() },
    { label: 'Wedding and group enquiries', message: waMessages.wedding() },
    { label: 'Corporate wardrobe enquiries', message: waMessages.corporate() },
    { label: 'Help with an order', message: 'Good day. I need assistance with an order. My order number is: ' },
    { label: 'Special requests', message: waMessages.special() },
  ]

  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Contact' }]} />
        <h1 className="display">Contact us</h1>
        <p className="lede">The quickest way to reach us is WhatsApp. You can also call, email or send a message from this page.</p>
      </header>

      <section className="infogrid" style={{ paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
        <div className="info">
          <h3>Visit the store</h3>
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
          <h3>Call or email</h3>
          {settings.phone && (
            <p>
              <a href={telLink(settings.phone)}>{settings.phone}</a>
            </p>
          )}
          {settings.phoneAlt && (
            <p>
              <a href={telLink(settings.phoneAlt)}>{settings.phoneAlt}</a>
            </p>
          )}
          {settings.email && (
            <p>
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </p>
          )}
        </div>
        <div className="info">
          <h3>{hours.length > 0 ? 'Opening hours' : 'Before you visit'}</h3>
          {hours.length > 0 ? hours.map((h) => <p key={h}>{h}</p>) : <p>Message or call us to check when we are open, or book a time that suits you.</p>}
          <p>
            <Link href="/book" className="link">
              Book an appointment
            </Link>
          </p>
        </div>
      </section>

      <section className="section-tight rule-top">
        <div className="checkout">
          <div className="stack">
            <h2 className="display-sm">Message us on WhatsApp</h2>
            <p className="soft">Choose what you need and WhatsApp opens with your message started for you.</p>
            {settings.whatsapp ? (
              <ul className="menu-list" style={{ marginTop: 6 }}>
                {topics.map((t) => (
                  <li key={t.label}>
                    <a href={waLink(settings.whatsapp, t.message)} target="_blank" rel="noopener noreferrer" style={{ textTransform: 'none', letterSpacing: 0, fontSize: '0.98rem', fontWeight: 500 }}>
                      {t.label}
                      <IconChevron width={18} height={18} style={{ color: 'var(--gold-3)', flex: 'none' }} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="notice">WhatsApp is not available at the moment. Please call or use the form.</p>
            )}
            <div>
              <WhatsAppButton message={waMessages.general()} className="btn btn-gold">
                Open WhatsApp
              </WhatsAppButton>
            </div>
          </div>
          <div className="stack">
            <h2 className="display-sm">Or send us a message</h2>
            <p className="soft">Not on WhatsApp? Use this form and we will reply by email or phone.</p>
            <EnquiryForm defaults={{ name: user ? `${user.firstName} ${user.lastName}` : undefined, phone: user?.phone ?? undefined, email: user?.email }} />
          </div>
        </div>
      </section>
    </div>
  )
}
