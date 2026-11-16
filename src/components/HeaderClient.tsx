'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { NAV_LINKS } from '@/lib/constants'
import { IconBag, IconCalendar, IconClose, IconMenu, IconSearch, IconUser, IconWhatsApp } from './icons'
import { useBag } from './cart/CartProvider'

type Props = {
  whatsappHref: string
  banner: { text: string; linkUrl: string | null; linkLabel: string | null } | null
  signedIn: boolean
  isAdmin: boolean
}

function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
}

export function HeaderClient({ whatsappHref, banner, signedIn, isAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const bag = useBag()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!menuOpen && !searchOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    if (menuOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menuOpen, searchOpen])

  return (
    <>
      {banner && (
        <div className="announce">
          {banner.text}
          {banner.linkUrl && <Link href={banner.linkUrl}>{banner.linkLabel || 'Find out more'}</Link>}
        </div>
      )}
      <header className="header">
        <div className="wrap header-bar">
          <div className="header-side">
            <button type="button" className="iconbtn menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
              <IconMenu />
            </button>
            <Link href="/book" className="header-cta">
              <IconCalendar />
              Book an appointment
            </Link>
            <a href={whatsappHref} className="header-cta" target="_blank" rel="noopener noreferrer">
              <IconWhatsApp />
              WhatsApp
            </a>
          </div>

          <Link href="/" className="wordmark" aria-label="MEN EXCLUSIVE, Dress to impress. Home">
            <Image src="/brand/emblem-gold.webp" alt="" width={44} height={44} priority />
            <span className="wordmark-text" aria-hidden>
              <span className="wordmark-name">MEN EXCLUSIVE</span>
              <span className="wordmark-tag">DRESS TO IMPRESS</span>
            </span>
          </Link>

          <div className="header-side header-side-end">
            <button type="button" className="iconbtn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <IconSearch />
            </button>
            <Link href={signedIn ? '/account' : '/account/login'} className="iconbtn" aria-label={signedIn ? 'Your account' : 'Sign in'}>
              <IconUser />
            </Link>
            <button type="button" className="iconbtn" onClick={bag.open} aria-label={`Shopping bag, ${bag.count} ${bag.count === 1 ? 'item' : 'items'}`}>
              <IconBag />
              {bag.ready && bag.count > 0 && <span className="bag-count">{bag.count}</span>}
            </button>
          </div>
        </div>
        <nav className="nav" aria-label="Main">
          <ul className="wrap">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={isCurrent(pathname, l.href) ? 'page' : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Search */}
      <div className="scrim" data-open={searchOpen} onClick={() => setSearchOpen(false)} aria-hidden />
      <div className="searchbar" data-open={searchOpen} role="dialog" aria-label="Search the store" inert={!searchOpen}>
        <div className="wrap">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              const q = searchRef.current?.value.trim()
              if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
              setSearchOpen(false)
            }}
          >
            <IconSearch width={22} height={22} style={{ color: 'var(--gold-3)', flex: 'none' }} />
            <input ref={searchRef} type="search" name="q" placeholder="Search suits, colours, occasions" aria-label="Search" autoComplete="off" enterKeyHint="search" />
            <button type="button" className="iconbtn" onClick={() => setSearchOpen(false)} aria-label="Close search">
              <IconClose />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="scrim" data-open={menuOpen} onClick={() => setMenuOpen(false)} aria-hidden />
      <aside className="drawer drawer-left" data-open={menuOpen} role="dialog" aria-modal="true" aria-label="Menu" inert={!menuOpen}>
        <div className="drawer-head">
          <span className="drawer-title">Menu</span>
          <button type="button" className="iconbtn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <IconClose />
          </button>
        </div>
        <nav className="drawer-body" aria-label="Mobile">
          <ul className="menu-list">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} aria-current={isCurrent(pathname, l.href) ? 'page' : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={signedIn ? '/account' : '/account/login'}>{signedIn ? 'Your account' : 'Sign in or register'}</Link>
            </li>
            {isAdmin && (
              <li>
                <Link href="/admin">Store admin</Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="drawer-foot">
          <Link href="/book" className="btn btn-gold btn-block">
            <IconCalendar />
            Book an appointment
          </Link>
          <a href={whatsappHref} className="btn btn-line btn-block" target="_blank" rel="noopener noreferrer">
            <IconWhatsApp />
            Chat on WhatsApp
          </a>
        </div>
      </aside>
    </>
  )
}
