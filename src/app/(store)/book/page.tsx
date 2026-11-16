import type { Metadata } from 'next'
import { AppointmentForm } from '@/components/AppointmentForm'
import { Crumbs } from '@/components/JsonLd'
import { WhatsAppButton } from '@/components/WhatsApp'
import { getCurrentUser } from '@/lib/auth'
import { APPOINTMENT_PURPOSES } from '@/lib/constants'
import { addressLines, getSettings } from '@/lib/settings'
import { waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Book a fitting or styling appointment',
  description: 'Request a private fitting, styling session or alteration assessment at MEN EXCLUSIVE in Johannesburg. Matric dance, wedding, graduation and corporate consultations.',
  alternates: { canonical: '/book' },
}

export default async function BookPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const [{ purpose }, user, settings] = await Promise.all([searchParams, getCurrentUser(), getSettings()])
  const preset = APPOINTMENT_PURPOSES.find((p) => p === purpose)
  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Book an appointment' }]} />
        <h1 className="display">Book a private fitting</h1>
        <p className="lede">Tell us when you would like to come in and what you need. We will reply to confirm a time.</p>
      </header>
      <div className="checkout" style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <AppointmentForm defaults={{ name: user ? `${user.firstName} ${user.lastName}` : undefined, phone: user?.phone ?? undefined, email: user?.email, purpose: preset }} />
        <aside className="stack-lg">
          <div className="pathcard">
            <h3>Prefer WhatsApp?</h3>
            <p>Message us directly and we will arrange a time with you there.</p>
            <div style={{ marginTop: 6 }}>
              <WhatsAppButton message={waMessages.fitting()} className="btn btn-gold">
                Request on WhatsApp
              </WhatsAppButton>
            </div>
          </div>
          <div className="info">
            <h3>Where to find us</h3>
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
            <h3>What to bring</h3>
            <p>The shirt and shoes you plan to wear, if you have them. They help us judge sleeve and trouser length properly.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
