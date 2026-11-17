import type { Metadata } from 'next'
import { setRequestStatusAction } from '@/app/actions/admin'
import { fmtDateTime } from '@/components/admin/bits'
import { REQUEST_STATUS_LABEL } from '@/lib/constants'
import { db } from '@/lib/db'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = { title: 'Appointments' }

export default async function AdminAppointments() {
  const items = await db.appointment.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200 })
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Appointment requests</h1>
          <p className="a-sub">Customers are told that a request is only confirmed once you reply. Contact them to agree a time, then mark the request as confirmed.</p>
        </div>
      </div>
      {items.length === 0 ? (
        <section className="a-card">
          <p className="a-empty">No appointment requests yet.</p>
        </section>
      ) : (
        items.map((a) => (
          <section key={a.id} className="a-card">
            <div className="a-head" style={{ marginBottom: 10 }}>
              <div>
                <h2>
                  {a.name}, {a.purpose}
                </h2>
                <p className="a-meta">Requested {fmtDateTime(a.createdAt)}</p>
              </div>
              <span className={`a-pill ${a.status === 'NEW' ? 'a-pill-warn' : a.status === 'DECLINED' ? 'a-pill-bad' : 'a-pill-ok'}`}>{REQUEST_STATUS_LABEL[a.status]}</span>
            </div>
            <dl className="a-dl">
              <dt>Preferred</dt>
              <dd>
                {a.preferredDate}, {a.preferredTime.toLowerCase()}
              </dd>
              {a.occasion && (
                <>
                  <dt>Occasion</dt>
                  <dd>{a.occasion}</dd>
                </>
              )}
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${a.phone}`}>{a.phone}</a>
              </dd>
              {a.email && (
                <>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${a.email}`}>{a.email}</a>
                  </dd>
                </>
              )}
              {a.notes && (
                <>
                  <dt>Notes</dt>
                  <dd>{a.notes}</dd>
                </>
              )}
            </dl>
            <form action={setRequestStatusAction} className="a-actions" style={{ marginTop: 14 }}>
              <input type="hidden" name="kind" value="appointment" />
              <input type="hidden" name="id" value={a.id} />
              <a
                className="a-btn a-btn-sm"
                href={waLink(a.phone, `Good day ${a.name}. This is MEN EXCLUSIVE about your appointment request for ${a.preferredDate} (${a.preferredTime.toLowerCase()}).`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reply on WhatsApp
              </a>
              <label className="sr-only" htmlFor={`note-${a.id}`}>
                Your note
              </label>
              <input id={`note-${a.id}`} name="adminNote" className="a-input" defaultValue={a.adminNote} placeholder="Your note, e.g. confirmed for 10:00" style={{ maxWidth: 300 }} />
              <label className="sr-only" htmlFor={`status-${a.id}`}>
                Status
              </label>
              <select id={`status-${a.id}`} name="status" className="a-select" defaultValue={a.status} style={{ width: 'auto' }}>
                {Object.entries(REQUEST_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="submit" className="a-btn a-btn-sm a-btn-primary">
                Update
              </button>
            </form>
          </section>
        ))
      )}
    </>
  )
}
