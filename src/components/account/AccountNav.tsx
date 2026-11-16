'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/account', label: 'Orders' },
  { href: '/account/details', label: 'Your details' },
  { href: '/account/addresses', label: 'Addresses' },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={pathname === l.href ? 'page' : undefined}>
          {l.label}
        </Link>
      ))}
    </>
  )
}
