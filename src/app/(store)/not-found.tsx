import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="wrap section">
      <div className="empty">
        <h1 className="display">We could not find that page</h1>
        <p className="soft">It may have moved, or the suit may no longer be available. Try the collection or search for what you need.</p>
        <div className="actions">
          <Link href="/shop" className="btn btn-gold">
            Shop suits
          </Link>
          <Link href="/search" className="btn btn-line">
            Search the store
          </Link>
        </div>
      </div>
    </div>
  )
}
