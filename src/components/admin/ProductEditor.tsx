'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { saveProductAction } from '@/app/actions/admin'
import type { EditorProduct } from '@/lib/admin-product'
import { COLOUR_FAMILIES } from '@/lib/constants'
import { slugify } from '@/lib/validation'

type Colour = EditorProduct['colours'][number]
type Img = EditorProduct['images'][number]
type Option = { id: string; name: string }

/** Shrinks a photo in the browser before upload, so it sends quickly on a phone connection. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1_500_000) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.9))
  } catch {
    return file
  }
}

export function ProductEditor({ initial, categories, occasions }: { initial: EditorProduct; categories: Option[]; occasions: Option[] }) {
  const router = useRouter()
  const [p, setP] = useState<EditorProduct>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id))
  const [newSizes, setNewSizes] = useState<Record<number, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const isNew = !p.id

  const set = <K extends keyof EditorProduct>(key: K, value: EditorProduct[K]) => setP((prev) => ({ ...prev, [key]: value }))
  const setColour = (ci: number, patch: Partial<Colour>) => setP((prev) => ({ ...prev, colours: prev.colours.map((c, i) => (i === ci ? { ...c, ...patch } : c)) }))
  const setVariant = (ci: number, vi: number, patch: Partial<Colour['variants'][number]>) =>
    setColour(ci, { variants: p.colours[ci].variants.map((v, i) => (i === vi ? { ...v, ...patch } : v)) })
  const setImage = (ii: number, patch: Partial<Img>) => setP((prev) => ({ ...prev, images: prev.images.map((img, i) => (i === ii ? { ...img, ...patch } : img)) }))
  const err = (key: string) => (errors[key] ? <small style={{ color: 'var(--a-bad)' }}>{errors[key]}</small> : null)

  const addSizes = (ci: number) => {
    const typed = (newSizes[ci] ?? '').split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
    if (typed.length === 0) return
    const existing = new Set(p.colours[ci].variants.map((v) => v.size.toLowerCase()))
    const fresh = typed.filter((s) => !existing.has(s.toLowerCase())).map((size) => ({ size, stock: 0, sku: '' }))
    setColour(ci, { variants: [...p.colours[ci].variants, ...fresh] })
    setNewSizes((n) => ({ ...n, [ci]: '' }))
  }

  const removeColour = (ci: number) =>
    setP((prev) => ({
      ...prev,
      colours: prev.colours.filter((_, i) => i !== ci),
      // Photos linked to the removed colour become general photos; later colours shift up by one.
      images: prev.images.map((img) => ({ ...img, colourIndex: img.colourIndex == null || img.colourIndex === ci ? null : img.colourIndex > ci ? img.colourIndex - 1 : img.colourIndex })),
    }))

  const moveImage = (ii: number, dir: -1 | 1) =>
    setP((prev) => {
      const images = [...prev.images]
      const target = ii + dir
      if (target < 0 || target >= images.length) return prev
      ;[images[ii], images[target]] = [images[target], images[ii]]
      return { ...prev, images }
    })

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setMessage(null)
    for (const file of Array.from(files).slice(0, 12)) {
      setUploading((n) => n + 1)
      try {
        const body = new FormData()
        body.append('file', await shrink(file), file.name)
        const res = await fetch('/api/admin/upload', { method: 'POST', body })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || 'Upload failed.')
        setP((prev) => ({ ...prev, images: [...prev.images, { url: json.url, alt: '', width: json.width, height: json.height, colourIndex: prev.colours.length === 1 ? 0 : null }] }))
      } catch (e) {
        setMessage({ ok: false, text: `${file.name}: ${e instanceof Error ? e.message : 'Upload failed.'}` })
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const save = async () => {
    setSaving(true)
    setMessage(null)
    setErrors({})
    try {
      const result = await saveProductAction(p)
      if (result.ok) {
        // Take the saved version back from the server so new colours, sizes and photos get their permanent IDs.
        setP(result.product)
        setMessage({ ok: true, text: result.message })
        if (isNew) router.replace(`/admin/products/${result.id}`)
        router.refresh()
      } else {
        setErrors(result.fields ?? {})
        setMessage({ ok: false, text: result.message })
      }
    } catch {
      setMessage({ ok: false, text: 'The product could not be saved. Check your connection and try again.' })
    }
    setSaving(false)
  }

  const totalStock = p.colours.reduce((n, c) => n + c.variants.reduce((m, v) => m + (Number(v.stock) || 0), 0), 0)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <div className="a-grid a-grid-2">
        <div>
          <section className="a-card">
            <h2>Product</h2>
            <div className="a-form" style={{ marginTop: 10 }}>
              <div className="a-field">
                <label htmlFor="pe-name">Name</label>
                <input
                  id="pe-name"
                  className="a-input"
                  value={p.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setP((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }))
                  }}
                  required
                />
                {err('name')}
              </div>
              <div className="a-row">
                <div className="a-field">
                  <label htmlFor="pe-sku">Reference (SKU)</label>
                  <input id="pe-sku" className="a-input" value={p.sku} onChange={(e) => set('sku', e.target.value)} required />
                  <small>Customers quote this when they enquire.</small>
                  {err('sku')}
                </div>
                <div className="a-field">
                  <label htmlFor="pe-cat">Suit type</label>
                  <select id="pe-cat" className="a-select" value={p.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value || null)}>
                    <option value="">None</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="a-field">
                <label htmlFor="pe-slug">Web address</label>
                <input
                  id="pe-slug"
                  className="a-input"
                  value={p.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set('slug', e.target.value)
                  }}
                />
                <small>/shop/{p.slug || 'product-name'}</small>
                {err('slug')}
              </div>
              <div className="a-field">
                <label htmlFor="pe-summary">Short description</label>
                <input id="pe-summary" className="a-input" value={p.summary} maxLength={300} onChange={(e) => set('summary', e.target.value)} />
                <small>One sentence shown next to the price.</small>
              </div>
              <div className="a-field">
                <label htmlFor="pe-desc">Full description</label>
                <textarea id="pe-desc" className="a-textarea" rows={5} value={p.description} onChange={(e) => set('description', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="a-card">
            <h2>Colours, sizes and stock</h2>
            <p className="a-help">
              Stock is kept per size of each colour. A size with 0 in stock shows as sold out. Total in stock: <strong>{totalStock}</strong>.
            </p>
            {errors._ && <div className="a-note a-note-bad" style={{ marginBottom: 12 }}>{errors._}</div>}
            {p.colours.map((c, ci) => (
              <div key={ci} className="a-colour">
                <div className="a-row a-row-3">
                  <div className="a-field">
                    <label htmlFor={`pe-c-${ci}`}>Colour name</label>
                    <input id={`pe-c-${ci}`} className="a-input" value={c.name} onChange={(e) => setColour(ci, { name: e.target.value })} />
                    {err(`colours.${ci}.name`)}
                  </div>
                  <div className="a-field">
                    <label htmlFor={`pe-h-${ci}`}>Swatch</label>
                    <input id={`pe-h-${ci}`} type="color" className="a-input" style={{ padding: 3 }} value={c.hex} onChange={(e) => setColour(ci, { hex: e.target.value })} />
                  </div>
                  <div className="a-field">
                    <label htmlFor={`pe-f-${ci}`}>Colour group (for the filter)</label>
                    <select id={`pe-f-${ci}`} className="a-select" value={c.family} onChange={(e) => setColour(ci, { family: e.target.value })}>
                      {COLOUR_FAMILIES.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="a-sizes">
                  {c.variants.length > 0 && (
                    <div className="a-size a-meta" aria-hidden>
                      <span>Size</span>
                      <span>In stock</span>
                      <span>Size reference (optional)</span>
                      <span />
                    </div>
                  )}
                  {c.variants.map((v, vi) => (
                    <div key={vi}>
                      <div className="a-size">
                        <input className="a-input" aria-label="Size" value={v.size} onChange={(e) => setVariant(ci, vi, { size: e.target.value })} />
                        <input
                          className="a-input"
                          aria-label={`Stock for size ${v.size}`}
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={Number.isFinite(v.stock) ? v.stock : ''}
                          onChange={(e) => setVariant(ci, vi, { stock: e.target.value === '' ? 0 : Math.max(0, Math.floor(Number(e.target.value))) })}
                        />
                        <input className="a-input" aria-label={`Reference for size ${v.size}`} value={v.sku} onChange={(e) => setVariant(ci, vi, { sku: e.target.value })} />
                        <button type="button" className="a-btn a-btn-sm" onClick={() => setColour(ci, { variants: c.variants.filter((_, i) => i !== vi) })} aria-label={`Remove size ${v.size}`}>
                          Remove
                        </button>
                      </div>
                      {err(`colours.${ci}.variants.${vi}.size`)}
                      {err(`colours.${ci}.variants.${vi}.stock`)}
                    </div>
                  ))}
                  <div className="a-actions">
                    <input
                      className="a-input"
                      style={{ maxWidth: 260 }}
                      aria-label="Sizes to add"
                      placeholder="Add sizes, e.g. 44, 46, 48"
                      value={newSizes[ci] ?? ''}
                      onChange={(e) => setNewSizes((n) => ({ ...n, [ci]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addSizes(ci)
                        }
                      }}
                    />
                    <button type="button" className="a-btn a-btn-sm" onClick={() => addSizes(ci)}>
                      Add sizes
                    </button>
                    <button type="button" className="a-btn a-btn-sm a-btn-danger" style={{ marginLeft: 'auto' }} onClick={() => window.confirm(`Remove the colour "${c.name}" and all its sizes?`) && removeColour(ci)}>
                      Remove colour
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <button type="button" className="a-btn" onClick={() => set('colours', [...p.colours, { name: '', hex: '#1a1a1a', family: 'black', variants: [] }])}>
                Add a colour
              </button>
            </div>
          </section>

          <section className="a-card">
            <h2>Photographs</h2>
            <p className="a-help">The first photograph is the one shown in the shop. Use real photographs of the garment. Link a photograph to a colour so it shows when the customer picks that colour.</p>
            <div className="a-images">
              {p.images.map((img, ii) => (
                <div key={img.url} className="a-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" loading="lazy" />
                  <input className="a-input" aria-label="Describe this photograph" placeholder="Describe the photograph" value={img.alt} onChange={(e) => setImage(ii, { alt: e.target.value })} />
                  {p.colours.length > 1 && (
                    <select className="a-select" aria-label="Colour shown" value={img.colourIndex ?? ''} onChange={(e) => setImage(ii, { colourIndex: e.target.value === '' ? null : Number(e.target.value) })}>
                      <option value="">All colours</option>
                      {p.colours.map((c, ci) => (
                        <option key={ci} value={ci}>
                          {c.name || `Colour ${ci + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="a-actions" style={{ gap: 6 }}>
                    <button type="button" className="a-btn a-btn-sm" disabled={ii === 0} onClick={() => moveImage(ii, -1)} aria-label="Move earlier">
                      Earlier
                    </button>
                    <button type="button" className="a-btn a-btn-sm" disabled={ii === p.images.length - 1} onClick={() => moveImage(ii, 1)} aria-label="Move later">
                      Later
                    </button>
                    <button type="button" className="a-btn a-btn-sm a-btn-danger" onClick={() => set('images', p.images.filter((_, i) => i !== ii))}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="a-actions" style={{ marginTop: 12 }}>
              <label className="a-btn" style={{ cursor: 'pointer' }}>
                {uploading > 0 ? `Uploading ${uploading}…` : 'Upload photographs'}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
              </label>
              <span className="a-meta">JPG, PNG or WebP. Portrait photographs work best.</span>
            </div>
          </section>

          <section className="a-card">
            <h2>Details</h2>
            <p className="a-help">Only enter what you have confirmed, for example from the garment label. Empty sections are not shown to customers.</p>
            <div className="a-form">
              <div className="a-field">
                <label htmlFor="pe-fit">Fit</label>
                <textarea id="pe-fit" className="a-textarea" rows={2} value={p.fit} onChange={(e) => set('fit', e.target.value)} placeholder="For example: slim fit, cut close through the chest and waist." />
              </div>
              <div className="a-field">
                <label htmlFor="pe-fabric">Fabric</label>
                <textarea id="pe-fabric" className="a-textarea" rows={2} value={p.fabric} onChange={(e) => set('fabric', e.target.value)} placeholder="Composition as shown on the label." />
              </div>
              <div className="a-field">
                <label htmlFor="pe-specs">Specifications</label>
                <textarea id="pe-specs" className="a-textarea" rows={4} value={p.specs} onChange={(e) => set('specs', e.target.value)} placeholder={'Pieces: Jacket, waistcoat and trousers\nLining: Fully lined'} />
                <small>One per line, written as “Label: value”.</small>
              </div>
              <div className="a-field">
                <label htmlFor="pe-care">Care instructions</label>
                <textarea id="pe-care" className="a-textarea" rows={3} value={p.care} onChange={(e) => set('care', e.target.value)} placeholder="As shown on the care label. One instruction per line." />
              </div>
            </div>
          </section>
        </div>

        <div>
          <section className="a-card">
            <h2>Price</h2>
            <div className="a-form" style={{ marginTop: 10 }}>
              <div className="a-field">
                <label htmlFor="pe-price">Price in Rand</label>
                <input id="pe-price" className="a-input" inputMode="decimal" value={p.price} onChange={(e) => set('price', e.target.value)} placeholder="Price on request" />
                <small>Leave empty to show “Price on request”. The product can then be enquired about but not bought online.</small>
                {err('price')}
              </div>
              <div className="a-field">
                <label htmlFor="pe-compare">Previous price in Rand (optional)</label>
                <input id="pe-compare" className="a-input" inputMode="decimal" value={p.compareAt} onChange={(e) => set('compareAt', e.target.value)} />
                <small>Shown crossed out when the product is on sale. It must be a price the product was genuinely sold at.</small>
                {err('compareAt')}
              </div>
            </div>
          </section>

          <section className="a-card">
            <h2>Where it appears</h2>
            <div className="a-form" style={{ marginTop: 10 }}>
              <label className="a-check">
                <input type="checkbox" checked={p.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                <span>Visible in the shop</span>
              </label>
              <label className="a-check">
                <input type="checkbox" checked={p.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
                <span>Featured collection on the homepage</span>
              </label>
              <label className="a-check">
                <input type="checkbox" checked={p.isNewArrival} onChange={(e) => set('isNewArrival', e.target.checked)} />
                <span>New arrival</span>
              </label>
              <label className="a-check">
                <input type="checkbox" checked={p.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} />
                <span>Best seller</span>
              </label>
              <div className="a-field">
                <label htmlFor="pe-sort">Position in the shop</label>
                <input id="pe-sort" className="a-input" type="number" min={0} value={p.sortOrder} onChange={(e) => set('sortOrder', Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
                <small>Lower numbers appear first.</small>
              </div>
            </div>
          </section>

          <section className="a-card">
            <h2>Occasions</h2>
            <p className="a-help">Tick every occasion this suit is right for.</p>
            <div className="a-form">
              {occasions.map((o) => (
                <label key={o.id} className="a-check">
                  <input
                    type="checkbox"
                    checked={p.occasionIds.includes(o.id)}
                    onChange={(e) => set('occasionIds', e.target.checked ? [...p.occasionIds, o.id] : p.occasionIds.filter((id) => id !== o.id))}
                  />
                  <span>{o.name}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="a-savebar">
        <button type="submit" className="a-btn a-btn-primary" disabled={saving || uploading > 0}>
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save product'}
        </button>
        {message && (
          <span className={message.ok ? 'a-note a-note-ok' : 'a-note a-note-bad'} role={message.ok ? 'status' : 'alert'} style={{ flex: 1, minWidth: 220 }}>
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}
