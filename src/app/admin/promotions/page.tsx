import type { Metadata } from 'next'
import { deleteBannerAction, deletePromoAction, saveBannerAction, savePromoAction } from '@/app/actions/admin'
import { ACheck, AdminForm, AField, ConfirmButton } from '@/components/admin/AdminForm'
import { db } from '@/lib/db'
import { centsToRandsInput, formatZAR } from '@/lib/money'

export const metadata: Metadata = { title: 'Promotions' }

const PROMO_TYPES = [
  { value: 'PERCENT', label: 'Percentage off' },
  { value: 'FIXED', label: 'Rand amount off' },
]
const day = (d: Date | null) => (d ? new Date(d.getTime() + 2 * 3600_000).toISOString().slice(0, 10) : '')

type Promo = { code: string; type: string; value: number; minSpendCents: number; startsAt: Date | null; endsAt: Date | null; maxUses: number | null; isActive: boolean }

function PromoFields({ p }: { p?: Promo }) {
  return (
    <>
      <div className="a-row a-row-3">
        <AField label="Code" name="code" defaultValue={p?.code} required placeholder="WELCOME10" />
        <AField label="Discount type" name="type" defaultValue={p?.type ?? 'PERCENT'} options={PROMO_TYPES} />
        <AField label="Amount" name="value" inputMode="decimal" defaultValue={p ? (p.type === 'FIXED' ? centsToRandsInput(p.value) : p.value) : ''} required help="A percentage (10) or a Rand amount (250)." />
      </div>
      <div className="a-row a-row-4">
        <AField label="Minimum spend (Rand)" name="minSpend" inputMode="decimal" defaultValue={centsToRandsInput(p?.minSpendCents || null)} help="Optional." />
        <AField label="Starts" name="startsAt" type="date" defaultValue={day(p?.startsAt ?? null)} help="Optional." />
        <AField label="Ends" name="endsAt" type="date" defaultValue={day(p?.endsAt ?? null)} help="Optional." />
        <AField label="Maximum uses" name="maxUses" type="number" defaultValue={p?.maxUses} help="Optional." />
      </div>
      <ACheck name="isActive" label="Customers can use this code" defaultChecked={p?.isActive ?? true} />
    </>
  )
}

export default async function AdminPromotions() {
  const [promos, banners] = await Promise.all([db.promoCode.findMany({ orderBy: { createdAt: 'desc' } }), db.banner.findMany({ orderBy: { sortOrder: 'asc' } })])
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Promotions</h1>
          <p className="a-sub">The announcement bar at the top of the website, and promo codes customers can enter at checkout.</p>
        </div>
      </div>

      <section className="a-card">
        <h2>Announcement bar</h2>
        <p className="a-help">A short message shown above the menu on every page. If more than one is switched on, the first is shown.</p>
        {banners.map((b) => (
          <details key={b.id} className="a-details">
            <summary>
              <span>{b.text}</span>
              <span className={`a-pill ${b.isActive ? 'a-pill-ok' : ''}`} style={{ marginLeft: 'auto', marginRight: 10 }}>
                {b.isActive ? 'On' : 'Off'}
              </span>
            </summary>
            <div className="a-details-body">
              <AdminForm action={saveBannerAction} hidden={{ id: b.id }} extra={<ConfirmButton action={deleteBannerAction} hidden={{ id: b.id }} label="Delete" confirm="Delete this announcement?" />}>
                <AField label="Announcement" name="text" defaultValue={b.text} required />
                <div className="a-row a-row-3">
                  <AField label="Link (optional)" name="linkUrl" defaultValue={b.linkUrl} placeholder="/shop" />
                  <AField label="Link text" name="linkLabel" defaultValue={b.linkLabel} placeholder="Shop now" />
                  <AField label="Position" name="sortOrder" type="number" defaultValue={b.sortOrder} />
                </div>
                <ACheck name="isActive" label="Show on the website" defaultChecked={b.isActive} />
              </AdminForm>
            </div>
          </details>
        ))}
        <details className="a-details">
          <summary>Add an announcement</summary>
          <div className="a-details-body">
            <AdminForm action={saveBannerAction} submitLabel="Add announcement">
              <AField label="Announcement" name="text" required placeholder="For example: Matric dance fittings now open" />
              <div className="a-row">
                <AField label="Link (optional)" name="linkUrl" placeholder="/book" />
                <AField label="Link text" name="linkLabel" placeholder="Book a fitting" />
              </div>
              <ACheck name="isActive" label="Show on the website" defaultChecked />
            </AdminForm>
          </div>
        </details>
      </section>

      <section className="a-card">
        <h2>Promo codes</h2>
        <p className="a-help">A code takes a percentage or a Rand amount off the items in an order. Delivery fees are not discounted.</p>
        {promos.map((p) => (
          <details key={p.id} className="a-details">
            <summary>
              <span>
                {p.code}{' '}
                <span className="a-meta">
                  {p.type === 'PERCENT' ? `${p.value}% off` : `${formatZAR(p.value)} off`}, used {p.usedCount}
                  {p.maxUses != null ? ` of ${p.maxUses}` : ''} times
                </span>
              </span>
              <span className={`a-pill ${p.isActive ? 'a-pill-ok' : ''}`} style={{ marginLeft: 'auto', marginRight: 10 }}>
                {p.isActive ? 'On' : 'Off'}
              </span>
            </summary>
            <div className="a-details-body">
              <AdminForm action={savePromoAction} hidden={{ id: p.id }} extra={<ConfirmButton action={deletePromoAction} hidden={{ id: p.id }} label="Delete" confirm={`Delete the code ${p.code}?`} />}>
                <PromoFields p={p} />
              </AdminForm>
            </div>
          </details>
        ))}
        <details className="a-details">
          <summary>Add a promo code</summary>
          <div className="a-details-body">
            <AdminForm action={savePromoAction} submitLabel="Add code">
              <PromoFields />
            </AdminForm>
          </div>
        </details>
      </section>
    </>
  )
}
