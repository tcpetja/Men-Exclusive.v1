import type { Metadata } from 'next'
import { deleteAddressAction, setDefaultAddressAction } from '@/app/actions/account'
import { AddressForm } from '@/components/account/AccountForms'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Your addresses', robots: { index: false } }

export default async function AddressesPage() {
  const user = await requireUser('/account/addresses')
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] })
  return (
    <div className="checkout">
      <section className="stack">
        <h2 className="display-sm">Saved addresses</h2>
        {addresses.length === 0 ? (
          <p className="soft">You have no saved addresses yet. Add one and it will be ready at checkout.</p>
        ) : (
          <div className="rows">
            {addresses.map((a) => (
              <div key={a.id} className="row" style={{ alignItems: 'start' }}>
                <div>
                  <div className="row-title">
                    {a.recipient} {a.isDefault && <span className="status status-ok" style={{ marginLeft: 8 }}>Default</span>}
                  </div>
                  <div className="row-sub">
                    {[a.line1, a.line2, a.suburb, a.city, a.province, a.postalCode].filter(Boolean).join(', ')}
                  </div>
                  <div className="row-sub">{a.phone}</div>
                </div>
                <div className="actions" style={{ gap: 14 }}>
                  {!a.isDefault && (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="remove">
                        Make default
                      </button>
                    </form>
                  )}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="remove">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="panel stack">
        <h2 className="step-title">Add an address</h2>
        <AddressForm defaults={{ recipient: `${user.firstName} ${user.lastName}`, phone: user.phone ?? '' }} />
      </section>
    </div>
  )
}
