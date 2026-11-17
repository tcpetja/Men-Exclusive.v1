import Image from 'next/image'
import type { CSSProperties } from 'react'

export type ShotImage = { url: string; alt: string; width: number; height: number; focusX: number; focusY: number }

/**
 * Works out how to frame a photograph on its garment.
 *
 * The store photographs share a busy backdrop (veined marble, the gold sign, the floor). Each photograph
 * records where the suit is (focusX / focusY), so a frame can be drawn in on the suit and the surroundings
 * left to fall away. Returns the image's size and offset in units of the frame, plus where the suit lands.
 */
export function frameShot(image: Pick<ShotImage, 'width' | 'height' | 'focusX' | 'focusY'>, ratio: number, zoom: number) {
  const imageRatio = image.width / image.height
  // Start from "cover": the image fills the frame on its tighter axis.
  let w = 1
  let h = ratio / imageRatio
  if (h < 1) {
    h = 1
    w = imageRatio / ratio
  }
  w *= zoom
  h *= zoom
  const fx = Math.min(100, Math.max(0, image.focusX)) / 100
  const fy = Math.min(100, Math.max(0, image.focusY)) / 100
  // Centre the suit, but never pull an edge of the photograph inside the frame.
  const left = Math.min(0, Math.max(1 - w, 0.5 - fx * w))
  const top = Math.min(0, Math.max(1 - h, 0.5 - fy * h))
  return { w, h, left, top, cx: left + fx * w, cy: top + fy * h }
}

const pct = (n: number) => `${(n * 100).toFixed(2)}%`

/**
 * A product photograph framed on the suit. The photograph itself fades out towards its edges (a CSS mask),
 * so the suit stands lit against whatever is behind it, like a spotlit window display, and the busy
 * backdrop falls away. The garment itself is never recoloured or retouched.
 */
export function Shot({
  image,
  alt,
  ratio = 4 / 5,
  zoom = 1.4,
  sizes,
  priority,
  className,
  shade = true,
}: {
  image: ShotImage
  alt?: string
  ratio?: number
  zoom?: number
  sizes: string
  priority?: boolean
  className?: string
  shade?: boolean
}) {
  const f = frameShot(image, ratio, zoom)
  return (
    <span className={['shot', shade ? 'shot-lit' : '', className ?? ''].filter(Boolean).join(' ')} style={{ aspectRatio: String(ratio), '--cx': pct(f.cx), '--cy': pct(f.cy) } as CSSProperties}>
      <span className="shot-img" style={{ width: pct(f.w), height: pct(f.h), left: pct(f.left), top: pct(f.top) }}>
        <Image src={image.url} alt={alt ?? image.alt} fill sizes={sizes} priority={priority} />
      </span>
    </span>
  )
}
