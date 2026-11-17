'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment } from 'react'

const GROUPS = [
  { label: 'Selling', links: [{ href: '/admin', label: 'Overview' }, { href: '/admin/orders', label: 'Orders' }, { href: '/admin/products', label: 'Products and stock' }] },
  { label: 'Customers', links: [{ href: '/admin/appointments', label: 'Appointments' }, { href: '/admin/enquiries', label: 'Enquiries' }, { href: '/admin/customers', label: 'Customers' }] },
  {
    label: 'Website',
    links: [
      { href: '/admin/catalogue', label: 'Suit types and occasions' },
      { href: '/admin/delivery', label: 'Delivery and collection' },
      { href: '/admin/promotions', label: 'Promotions' },
      { href: '/admin/testimonials', label: 'Testimonials' },
      { href: '/admin/content', label: 'Website content' },
      { href: '/admin/settings', label: 'Store settings' },
    ],
  },
]

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname()
  return (
    <nav className="a-nav" aria-label="Admin">
      {GROUPS.map((g) => (
        <Fragment key={g.label}>
          <span className="a-nav-group">{g.label}</span>
          {g.links.map((l) => {
            const current = l.href === '/admin' ? pathname === '/admin' : pathname.startsWith(l.href)
            const badge = badges[l.href]
            return (
              <Link key={l.href} href={l.href} aria-current={current ? 'page' : undefined}>
                {l.label}
                {badge ? <span className="a-pill a-pill-warn" style={{ marginLeft: 8 }}>{badge}</span> : null}
              </Link>
            )
          })}
        </Fragment>
      ))}
    </nav>
  )
}
