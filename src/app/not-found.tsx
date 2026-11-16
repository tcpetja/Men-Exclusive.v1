import Link from 'next/link'

export default function RootNotFound() {
  return (
    <main className="wrap section">
      <div className="empty">
        <h1 className="display">We could not find that page</h1>
        <p className="soft">The address may be wrong, or the page may have moved.</p>
        <Link href="/" className="btn btn-gold">
          Go to the homepage
        </Link>
      </div>
    </main>
  )
}
