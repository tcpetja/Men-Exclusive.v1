import type { Metadata } from 'next'
import { deleteDeliveryAction, saveDeliveryAction } from '@/app/actions/admin'
import { ACheck, AdminForm, AField, ConfirmSubmit } from '@/components/admin/AdminForm'
import { db } from '@/lib/db'
import { centsToRandsInput, formatZAR } from '@/lib/money'

export const metadata: Metadata = { title: 'Delivery and collection' }

const TYPES = [
  { value: 'COLLECTION', label: 'Collection from the store' },
  { value: 'DELIVERY', label: 'Delivery to an address' },
]

function Fields({ m }: { m?: { name: string; type: string; feeCents: number; freeOverCents: number | null; description: string; isActive: boolean; sortOrder: number } }) {
  return (
    <>
      <div className="a-row">
        <AField label="Name shown at checkout" name="name" defaultValue={m?.name} required placeholder="For example: Courier delivery, Gauteng" />
        <AField label="Type" name="type" defaultValue={m?.type ?? 'DELIVERY'} options={TYPES} />
      </div>
      <div className="a-row a-row-3">
        <AField label="Fee in Rand" name="fee" inputMode="decimal" defaultValue={centsToRandsInput(m?.feeCents ?? 0)} help="Enter 0 if it is free." />
        <AField label="Free for orders over (Rand)" name="freeOver" inputMode="decimal" defaultValue={centsToRandsInput(m?.freeOverCents)} help="Optional." />
        <AField label="Position" name="sortOrder" type="number" defaultValue={m?.sortOrder ?? 1} />
      </div>
      <AField label="What the customer should know" name="description" defaultValue={m?.description} help="For example where you deliver and how long it takes. Only state times you can keep." />
      <ACheck name="isActive" label="Offer this option at checkout" defaultChecked={m?.isActive ?? false} />
    </>
  )
}

export default async function AdminDelivery() {
  const methods = await db.deliveryMethod.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
  const active = methods.filter((m) => m.isActive).length
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Delivery and collection</h1>
          <p className="a-sub">These are the options customers choose from at checkout. The fee is added to the order total before they pay.</p>
        </div>
      </div>
      {active === 0 && <div className="a-note a-note-bad" style={{ marginBottom: 18 }}>No option is switched on, so customers cannot complete checkout. Switch on at least one.</div>}
      <section className="a-card">
        <h2>Your options</h2>
        <p className="a-help">Options that are switched off are saved here but hidden from customers.</p>
        {methods.map((m) => (
          <details key={m.id} className="a-details">
            <summary>
              <span>
                {m.name}{' '}
                <span className="a-meta">
                  {m.type === 'COLLECTION' ? 'Collection' : 'Delivery'}, {m.feeCents ? formatZAR(m.feeCents) : 'free'}
                </span>
              </span>
              <span className={`a-pill ${m.isActive ? 'a-pill-ok' : ''}`} style={{ marginLeft: 'auto', marginRight: 10 }}>
                {m.isActive ? 'On' : 'Off'}
              </span>
            </summary>
            <div className="a-details-body">
              <AdminForm action={saveDeliveryAction} hidden={{ id: m.id }} extra={<ConfirmSubmit action={deleteDeliveryAction} label="Delete" confirm={`Delete "${m.name}"?`} />}>
                <Fields m={m} />
              </AdminForm>
            </div>
          </details>
        ))}
        <details className="a-details">
          <summary>Add an option</summary>
          <div className="a-details-body">
            <AdminForm action={saveDeliveryAction} submitLabel="Add option">
              <Fields />
            </AdminForm>
          </div>
        </details>
      </section>
    </>
  )
}
