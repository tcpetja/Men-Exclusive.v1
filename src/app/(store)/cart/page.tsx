import type { Metadata } from 'next'
import { Crumbs } from '@/components/JsonLd'
import { CartView } from '@/components/cart/CartView'
import { getSettings } from '@/lib/settings'
import { waLink, waMessages } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Your bag', robots: { index: false } }

export default async function CartPage() {
  const settings = await getSettings()
  return (
    <div className="wrap">
      <header className="pagehead">
        <Crumbs items={[{ name: 'Home', path: '/' }, { name: 'Your bag' }]} />
        <h1 className="display">Your bag</h1>
      </header>
      <div style={{ paddingBottom: 'clamp(56px, 9vw, 120px)' }}>
        <CartView whatsappHref={settings.whatsapp ? waLink(settings.whatsapp, waMessages.general()) : null} />
      </div>
    </div>
  )
}
