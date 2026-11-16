import type { Metadata } from 'next'
import Link from 'next/link'
import { Crumbs } from '@/components/JsonLd'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { waLink } from '@/lib/whatsapp'
import { paymentsReady, yocoConfig } from '@/lib/yoco'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()])
  const addresses = user ? await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }) : []
  const config = yocoConfig()
  const ready = paymentsReady(config)

  return (
    <div className="wrap">
      <header className="pagehead" style={{ paddingBottom: 24 }}>
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Your bag', path: '/cart' }, { name: 'Checkout' }]} />
        <h1 className="display">Checkout</h1>
        {!user && (
          <p className="soft">
            Checking out as a guest.{' '}
            <Link href="/account/login?next=/checkout" className="link">
              Sign in
            </Link>{' '}
            to use your saved details, or carry on below.
          </p>
        )}
      </header>
      <div style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <CheckoutForm
          paymentsReady={ready}
          testMode={config.mode === 'test'}
          whatsappHref={settings.whatsapp ? waLink(settings.whatsapp, 'Good day. I would like help completing an order from your website.') : null}
          customer={user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone ?? '' } : null}
          addresses={addresses.map((a) => ({ id: a.id, line1: a.line1, line2: a.line2 ?? '', suburb: a.suburb, city: a.city, province: a.province, postalCode: a.postalCode }))}
        />
      </div>
    </div>
  )
}
