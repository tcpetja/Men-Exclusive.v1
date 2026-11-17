import type { Metadata } from 'next'
import { setRequestStatusAction } from '@/app/actions/admin'
import { fmtDateTime } from '@/components/admin/bits'
import { db } from '@/lib/db'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Enquiries' }

export default async function AdminEnquiries() {
  const items = await db.enquiry.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200 })
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Enquiries</h1>
          <p className="a-sub">Messages sent from the contact form. WhatsApp messages arrive in WhatsApp and are not listed here.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <section className="a-card">
          <p className="a-empty">No enquiries yet.</p>
        </section>
      ) : (
        items.map((e) => (
          <section key={e.id} className="a-card">
            <div className="a-head" style={{ marginBottom: 10 }}>
              <div>
                <h2>
                  {e.name}, {e.topic}
                </h2>
                <p className="a-meta">Sent {fmtDateTime(e.createdAt)}</p>
              </div>
              <span className={`a-pill ${e.status === 'NEW' ? 'a-pill-warn' : 'a-pill-ok'}`}>{e.status === 'NEW' ? 'New' : 'Answered'}</span>
            </div>
            <p style={{ whiteSpace: 'pre-wrap', maxWidth: '75ch' }}>{e.message}</p>
            <form action={setRequestStatusAction} className="a-actions" style={{ marginTop: 14 }}>
              <input type="hidden" name="kind" value="enquiry" />
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="status" value={e.status === 'NEW' ? 'DONE' : 'NEW'} />
              {e.email && (
                <a className="a-btn a-btn-sm" href={`mailto:${e.email}?subject=${encodeURIComponent('Your enquiry to MEN EXCLUSIVE')}`}>
                  Reply by email
                </a>
              )}
              {e.phone && (
                <a className="a-btn a-btn-sm" href={waLink(e.phone, `Good day ${e.name}. This is MEN EXCLUSIVE replying to your enquiry.`)} target="_blank" rel="noopener noreferrer">
                  Reply on WhatsApp
                </a>
              )}
              <button type="submit" className="a-btn a-btn-sm a-btn-primary">
                {e.status === 'NEW' ? 'Mark as answered' : 'Mark as new'}
              </button>
              <span className="a-meta">{[e.email, e.phone].filter(Boolean).join(', ')}</span>
            </form>
          </section>
        ))
      )}
    </>
  )
}
