'use client'

import Link from 'next/link'
import Script from 'next/script'
import { useEffect, useState } from 'react'

const KEY = 'me_consent'

/**
 * Cookie notice. Google Analytics is only loaded after the visitor accepts (POPIA), and only if a
 * measurement ID has been entered in Admin → Store settings. With no ID, no notice is shown at all,
 * because the site then uses essential storage only.
 */
export function Consent({ gaId }: { gaId: string }) {
  const [choice, setChoice] = useState<'unknown' | 'accepted' | 'declined'>('unknown')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === 'accepted' || saved === 'declined') setChoice(saved)
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  if (!gaId || !/^G-[A-Z0-9]+$/.test(gaId)) return null

  const choose = (value: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* ignore */
    }
    setChoice(value)
  }

  return (
    <>
      {choice === 'accepted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {ready && choice === 'unknown' && (
        <div className="consent" role="region" aria-label="Cookie notice">
          <div className="wrap consent-inner">
            <p>
              We use essential cookies to run the store. With your permission we also use analytics to see which pages are popular.{' '}
              <Link href="/policies/cookies" className="link">
                Cookie policy
              </Link>
            </p>
            <div className="actions">
              <button type="button" className="btn btn-line btn-sm" onClick={() => choose('declined')}>
                Essential only
              </button>
              <button type="button" className="btn btn-gold btn-sm" onClick={() => choose('accepted')}>
                Accept analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
