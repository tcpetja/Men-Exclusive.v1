import type { Metadata } from 'next'
import { deleteTestimonialAction, saveTestimonialAction } from '@/app/actions/admin'
import { ACheck, AdminForm, AField, ConfirmSubmit } from '@/components/admin/AdminForm'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Testimonials' }

function Fields({ t }: { t?: { name: string; context: string; quote: string; isPublished: boolean; sortOrder: number } }) {
  return (
    <>
      <div className="a-row a-row-3">
        <AField label="Customer name" name="name" defaultValue={t?.name} required placeholder="First name and initial is fine" />
        <AField label="Who they are (optional)" name="context" defaultValue={t?.context} placeholder="For example: Groom, Soweto" />
        <AField label="Position" name="sortOrder" type="number" defaultValue={t?.sortOrder ?? 1} />
      </div>
      <AField label="What they said" name="quote" defaultValue={t?.quote} rows={3} required />
      <ACheck name="isPublished" label="Show on the website" defaultChecked={t?.isPublished ?? false} />
    </>
  )
}

export default async function AdminTestimonials() {
  const items = await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Testimonials</h1>
          <p className="a-sub">
            Real feedback from real customers, shown on the homepage. Only publish words a customer actually said, and ask their permission first. Until one is published, the homepage simply leaves the section out.
          </p>
        </div>
      </div>
      <section className="a-card">
        {items.map((t) => (
          <details key={t.id} className="a-details">
            <summary>
              <span>
                {t.name} <span className="a-meta">{t.quote.slice(0, 70)}{t.quote.length > 70 ? '…' : ''}</span>
              </span>
              <span className={`a-pill ${t.isPublished ? 'a-pill-ok' : ''}`} style={{ marginLeft: 'auto', marginRight: 10 }}>
                {t.isPublished ? 'Published' : 'Draft'}
              </span>
            </summary>
            <div className="a-details-body">
              <AdminForm action={saveTestimonialAction} hidden={{ id: t.id }} extra={<ConfirmSubmit action={deleteTestimonialAction} label="Delete" confirm="Delete this testimonial?" />}>
                <Fields t={t} />
              </AdminForm>
            </div>
          </details>
        ))}
        <details className="a-details" open={items.length === 0}>
          <summary>Add a testimonial</summary>
          <div className="a-details-body">
            <AdminForm action={saveTestimonialAction} submitLabel="Add testimonial">
              <Fields />
            </AdminForm>
          </div>
        </details>
      </section>
    </>
  )
}
