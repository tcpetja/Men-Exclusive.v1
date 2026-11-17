'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { formatZAR } from '@/lib/money'
import { useBag } from '../cart/CartProvider'
import { IconCalendar, IconClose, IconLock, IconPin, IconWhatsApp } from '../icons'

export type BuyProduct = {
  name: string
  sku: string
  categoryName: string | null
  summary: string
  priceCents: number | null
  compareAtCents: number | null
  colours: { id: string; name: string; hex: string; variants: { id: string; size: string; stock: number }[] }[]
  images: { url: string; alt: string; colourId: string | null }[]
}

export function ProductBuy({ product, wa }: { product: BuyProduct; wa: { enquire: string; size: string; price: string } | null }) {
  const bag = useBag()
  const p = product
  const firstAvailable = p.colours.find((c) => c.variants.some((v) => v.stock > 0)) ?? p.colours[0]
  const [colourId, setColourId] = useState<string | null>(firstAvailable?.id ?? null)
  const colour = p.colours.find((c) => c.id === colourId) ?? null
  const inStockSizes = colour?.variants.filter((v) => v.stock > 0) ?? []
  const [variantId, setVariantId] = useState<string | null>(inStockSizes.length === 1 ? inStockSizes[0].id : null)
  const [quantity, setQuantity] = useState(1)
  const [imageIndex, setImageIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const stageRef = useRef<HTMLButtonElement>(null)

  const images = useMemo(() => {
    const forColour = p.images.filter((i) => i.colourId === colourId)
    return forColour.length > 0 ? [...forColour, ...p.images.filter((i) => i.colourId === null)] : p.images
  }, [p.images, colourId])
  const image = images[Math.min(imageIndex, images.length - 1)]

  const variant = colour?.variants.find((v) => v.id === variantId) ?? null
  const hasSizes = p.colours.some((c) => c.variants.length > 0)
  const anyStock = p.colours.some((c) => c.variants.some((v) => v.stock > 0))
  const buyable = p.priceCents != null && hasSizes
  const maxQty = Math.min(variant?.stock ?? 1, 10)

  useEffect(() => {
    if (!viewerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerOpen(false)
      if (e.key === 'ArrowRight') setImageIndex((i) => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setImageIndex((i) => (i - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [viewerOpen, images.length])

  // Moving the pointer over the photograph draws that spot closer, to look at the cloth.
  const trackPointer = (e: MouseEvent<HTMLButtonElement>) => {
    const el = stageRef.current
    if (!el) return
    const box = el.getBoundingClientRect()
    el.style.setProperty('--zx', `${((e.clientX - box.left) / box.width) * 100}%`)
    el.style.setProperty('--zy', `${((e.clientY - box.top) / box.height) * 100}%`)
  }

  const chooseColour = (id: string) => {
    setColourId(id)
    setImageIndex(0)
    setQuantity(1)
    const sizes = p.colours.find((c) => c.id === id)?.variants.filter((v) => v.stock > 0) ?? []
    setVariantId(sizes.length === 1 ? sizes[0].id : null)
  }

  const addToBag = () => {
    if (!variant || variant.stock < 1) return
    bag.add(variant.id, Math.min(quantity, maxQty))
    bag.open()
  }

  return (
    <div className="pdp">
      <div className={images.length > 1 ? 'gallery gallery-multi' : 'gallery'}>
        <button ref={stageRef} type="button" className="gallery-main" onMouseMove={trackPointer} onClick={() => setViewerOpen(true)} aria-label="View this photograph full screen">
          {image && <Image src={image.url} alt={image.alt || p.name} fill priority sizes="(min-width: 900px) 62vw, 100vw" />}
        </button>
        {images.length > 1 && (
          <div className="gallery-thumbs" role="group" aria-label="Product photographs">
            {images.map((img, i) => (
              <button key={img.url} type="button" className="gallery-thumb" aria-current={i === imageIndex} aria-label={`Show photograph ${i + 1} of ${images.length}`} onClick={() => setImageIndex(i)}>
                <Image src={img.url} alt="" fill sizes="76px" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pdp-info">
        <div className="stack" style={{ gap: 12 }}>
          {p.categoryName && <p className="pdp-kind">{p.categoryName}</p>}
          <h1 className="pdp-title">{p.name}</h1>
          {p.priceCents != null ? (
            <p className="pdp-price">
              {formatZAR(p.priceCents)}
              {p.compareAtCents != null && p.compareAtCents > p.priceCents && <span className="price-was">{formatZAR(p.compareAtCents)}</span>}
            </p>
          ) : (
            <p className="pdp-price pdp-price-request">Price on request</p>
          )}
        </div>

        {p.summary && <p className="soft">{p.summary}</p>}

        {p.colours.length > 0 && (
          <div className="optgroup">
            <div className="optgroup-head">
              <span>
                Colour: <b>{colour?.name}</b>
              </span>
            </div>
            {p.colours.length > 1 && (
              <div className="swatches" role="radiogroup" aria-label="Colour">
                {p.colours.map((c) => (
                  <button key={c.id} type="button" role="radio" aria-checked={c.id === colourId} aria-label={c.name} title={c.name} className="swatch" style={{ background: c.hex }} onClick={() => chooseColour(c.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {buyable && colour && colour.variants.length > 0 && (
          <div className="optgroup">
            <div className="optgroup-head">
              <span>
                Size{variant ? ': ' : ''}
                {variant && <b>{variant.size}</b>}
              </span>
              {wa && (
                <a href={wa.size} target="_blank" rel="noopener noreferrer" className="link" style={{ fontSize: '0.82rem' }}>
                  Help me choose a size
                </a>
              )}
            </div>
            <div className="sizes" role="radiogroup" aria-label="Size">
              {colour.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={v.id === variantId}
                  aria-label={v.stock > 0 ? `Size ${v.size}` : `Size ${v.size}, sold out`}
                  disabled={v.stock < 1}
                  className="sizebtn"
                  onClick={() => {
                    setVariantId(v.id)
                    setQuantity(1)
                  }}
                >
                  {v.size}
                </button>
              ))}
            </div>
            {variant && variant.stock <= 2 && <p className="gold" style={{ fontSize: '0.84rem' }}>Only {variant.stock} left in this size.</p>}
          </div>
        )}

        {buyable && anyStock ? (
          <div className="stack" style={{ gap: 12 }}>
            <div className="actions" style={{ flexWrap: 'nowrap' }}>
              <div className="qty" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" aria-label="Increase quantity" disabled={!variant || quantity >= maxQty} onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}>
                  +
                </button>
              </div>
              <button type="button" className="btn btn-gold" style={{ flex: 1 }} disabled={!variant} onClick={addToBag}>
                {variant ? 'Add to bag' : 'Select a size'}
              </button>
            </div>
            {wa && (
              <a href={wa.enquire} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-block">
                <IconWhatsApp />
                Ask about this suit
              </a>
            )}
          </div>
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            <p className="soft">
              {buyable
                ? 'This suit is sold out online at the moment. Message us and we will check what is available in store.'
                : 'Available in store. Message us for the price and sizes, or book a fitting to try it on.'}
            </p>
            {wa && (
              <a href={p.priceCents == null ? wa.price : wa.enquire} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-block">
                <IconWhatsApp />
                Enquire on WhatsApp
              </a>
            )}
            <Link href="/book" className="btn btn-line btn-block">
              <IconCalendar />
              Book a fitting
            </Link>
          </div>
        )}

        <ul className="assure">
          <li>
            <IconLock />
            <span>Secure payment by Yoco. Card details never touch this website.</span>
          </li>
          <li>
            <IconCalendar />
            <span>Fittings and adjustments in store, by appointment.</span>
          </li>
          <li>
            <IconPin />
            <span>Collection and delivery options are shown at checkout.</span>
          </li>
        </ul>
        <p className="pdp-ref">Ref {p.sku}</p>
      </div>

      {/* Full-screen viewer */}
      <div className="viewer" data-open={viewerOpen} role="dialog" aria-modal="true" aria-label={`${p.name}, photograph ${imageIndex + 1} of ${images.length}`} inert={!viewerOpen} onClick={() => setViewerOpen(false)}>
        {viewerOpen && image && (
          <>
            {/* Same size request as the gallery, so the photograph is already loaded and appears at once. */}
            <Image src={image.url} alt={image.alt || p.name} fill sizes="(min-width: 900px) 62vw, 100vw" />
            <button type="button" className="iconbtn viewer-close" aria-label="Close" onClick={() => setViewerOpen(false)}>
              <IconClose />
            </button>
            {images.length > 1 && (
              <div className="viewer-count" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="textlink" onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)}>
                  Previous
                </button>
                <span>
                  {imageIndex + 1} / {images.length}
                </span>
                <button type="button" className="textlink" onClick={() => setImageIndex((i) => (i + 1) % images.length)}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
