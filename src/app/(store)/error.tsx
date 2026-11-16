'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <div className="wrap section">
      <div className="empty">
        <h1 className="display">Something went wrong</h1>
        <p className="soft">The page could not be loaded. If you were paying for an order, nothing has been charged twice. Check your email for a confirmation before trying again.</p>
        <div className="actions">
          <button type="button" className="btn btn-gold" onClick={reset}>
            Try again
          </button>
          <Link href="/" className="btn btn-line">
            Go to the homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
