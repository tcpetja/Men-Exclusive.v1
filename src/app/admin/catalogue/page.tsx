import type { Metadata } from 'next'
import { deleteCategoryAction, saveCategoryAction, saveOccasionAction } from '@/app/actions/admin'
import { AdminForm, AField, ConfirmSubmit } from '@/components/admin/AdminForm'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Suit types and occasions' }

export default async function AdminCatalogue() {
  const [categories, occasions] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } }),
    db.occasion.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { products: true } } } }),
  ])
  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Suit types and occasions</h1>
          <p className="a-sub">Suit types power the “Suit type” filter in the shop. Occasions power the “Shop by occasion” pages. Products are assigned to both in the product editor.</p>
        </div>
      </div>

      <section className="a-card">
        <h2>Suit types</h2>
        <p className="a-help">A suit type only appears in the shop filter once it has products.</p>
        {categories.map((c) => (
          <details key={c.id} className="a-details">
            <summary>
              <span>
                {c.name} <span className="a-meta">{c._count.products} products</span>
              </span>
            </summary>
            <div className="a-details-body">
              <AdminForm
                action={saveCategoryAction}
                hidden={{ id: c.id }}
                extra={c._count.products === 0 ? <ConfirmSubmit action={deleteCategoryAction} label="Delete" confirm={`Delete the suit type "${c.name}"?`} /> : undefined}
              >
                <div className="a-row a-row-3">
                  <AField label="Name" name="name" defaultValue={c.name} required />
                  <AField label="Web address" name="slug" defaultValue={c.slug} />
                  <AField label="Position" name="sortOrder" type="number" defaultValue={c.sortOrder} />
                </div>
                <AField label="Description" name="description" defaultValue={c.description} />
              </AdminForm>
            </div>
          </details>
        ))}
        <details className="a-details">
          <summary>Add a suit type</summary>
          <div className="a-details-body">
            <AdminForm action={saveCategoryAction} submitLabel="Add suit type">
              <div className="a-row">
                <AField label="Name" name="name" required placeholder="For example: Tuxedos" />
                <AField label="Position" name="sortOrder" type="number" defaultValue={categories.length + 1} />
              </div>
              <AField label="Description" name="description" />
            </AdminForm>
          </div>
        </details>
      </section>

      <section className="a-card">
        <h2>Occasions</h2>
        <p className="a-help">Each occasion has its own page with an introduction, the suits assigned to it and styling advice. Write the advice as a list, starting each line with a hyphen.</p>
        {occasions.map((o) => (
          <details key={o.id} className="a-details">
            <summary>
              <span>
                {o.name} <span className="a-meta">{o._count.products} products</span>
              </span>
            </summary>
            <div className="a-details-body">
              <AdminForm action={saveOccasionAction} hidden={{ id: o.id }}>
                <div className="a-row">
                  <AField label="Name" name="name" defaultValue={o.name} required />
                  <AField label="Position" name="sortOrder" type="number" defaultValue={o.sortOrder} />
                </div>
                <AField label="Opening line" name="tagline" defaultValue={o.tagline} required />
                <AField label="Introduction" name="intro" defaultValue={o.intro} rows={3} required />
                <AField label="Styling advice" name="stylingNotes" defaultValue={o.stylingNotes} rows={6} help="One tip per line, each starting with a hyphen." />
                <div className="a-row">
                  <AField label="Search engine title (optional)" name="seoTitle" defaultValue={o.seoTitle} />
                  <AField label="Search engine description (optional)" name="seoDesc" defaultValue={o.seoDesc} />
                </div>
              </AdminForm>
            </div>
          </details>
        ))}
      </section>
    </>
  )
}
