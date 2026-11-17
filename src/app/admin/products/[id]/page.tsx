import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteProductAction } from '@/app/actions/admin'
import { ConfirmButton } from '@/components/admin/AdminForm'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { blankEditorProduct, loadEditorProduct } from '@/lib/admin-product'
import { db } from '@/lib/db'

export const metadata: Metadata = { title: 'Edit product' }

export default async function AdminProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === 'new'
  const [product, categories, occasions] = await Promise.all([
    isNew ? blankEditorProduct() : loadEditorProduct(id),
    db.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    db.occasion.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ])
  if (!product) notFound()

  return (
    <>
      <p style={{ marginBottom: 10 }}>
        <Link href="/admin/products">Back to all products</Link>
      </p>
      <div className="a-head">
        <div>
          <h1 className="a-title">{isNew ? 'Add a product' : product.name}</h1>
          {!isNew && <p className="a-sub">Ref {product.sku}</p>}
        </div>
        {!isNew && (
          <div className="a-actions">
            <a href={`/shop/${product.slug}`} target="_blank" className="a-btn">
              View in shop
            </a>
            <ConfirmButton action={deleteProductAction} hidden={{ id }} label="Delete product" confirm={`Delete "${product.name}" permanently? Past orders keep their record of it. To hide it instead, untick "Visible in the shop".`} className="a-btn a-btn-danger" />
          </div>
        )}
      </div>
      <ProductEditor key={isNew ? 'new' : id} initial={product} categories={categories} occasions={occasions} />
    </>
  )
}
