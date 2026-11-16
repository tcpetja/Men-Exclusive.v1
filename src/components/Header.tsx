import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { waLink, waMessages } from '@/lib/whatsapp'
import { HeaderClient } from './HeaderClient'

export async function Header() {
  const [settings, banner, user] = await Promise.all([
    getSettings(),
    db.banner.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { text: true, linkUrl: true, linkLabel: true } }),
    getCurrentUser(),
  ])
  return (
    <HeaderClient
      whatsappHref={waLink(settings.whatsapp, waMessages.general())}
      banner={banner}
      signedIn={Boolean(user)}
      isAdmin={user?.role === 'ADMIN'}
    />
  )
}
