import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import { CartProvider } from '@/components/cart/CartProvider'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { Consent } from '@/components/Consent'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { NavProgress } from '@/components/NavProgress'
import { WhatsAppFloat } from '@/components/WhatsApp'
import { storeJsonLd } from '@/lib/seo'
import { getSettings } from '@/lib/settings'

// Prices and stock must always be current, so storefront pages are rendered per request.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings()
  return s.searchConsoleVerification ? { verification: { google: s.searchConsoleVerification } } : {}
}

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings()
  return (
    <CartProvider>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      <Consent gaId={settings.gaMeasurementId} />
      <JsonLd data={storeJsonLd(settings)} />
    </CartProvider>
  )
}
