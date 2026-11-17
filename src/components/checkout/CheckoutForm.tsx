'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { placeOrderAction, quoteAction, type QuoteView } from '@/app/actions/shop'
import { SA_PROVINCES } from '@/lib/constants'
import { formatZAR } from '@/lib/money'
import { useBag } from '../cart/CartProvider'
import { IconLock, IconWhatsApp } from '../icons'

type Address = { id?: string; line1: string; line2: string; suburb: string; city: string; province: string; postalCode: string }
type Props = {
  paymentsReady: boolean
  testMode: boolean
  whatsappHref: string | null
  customer: { firstName: string; lastName: string; email: string; phone: string } | null
  addresses: (Address & { id: string })[]
}

const EMPTY_ADDRESS: Address = { line1: '', line2: '', suburb: '', city: '', province: 'Gauteng', postalCode: '' }

export function CheckoutForm({ paymentsReady, testMode, whatsappHref, customer, addresses }: Props) {
  const bag = useBag()
  const [contact, setContact] = useState({ firstName: customer?.firstName ?? '', lastName: customer?.lastName ?? '', email: customer?.email ?? '', phone: customer?.phone ?? '' })
  const [methodId, setMethodId] = useState<string | null>(null)
  const [address, setAddress] = useState<Address>(addresses[0] ?? EMPTY_ADDRESS)
  const [promoInput, setPromoInput] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [note, setNote] = useState('')
  const [terms, setTerms] = useState(false)
  const [quote, setQuote] = useState<QuoteView | null>(null)
  const [quoteFailed, setQuoteFailed] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const seq = useRef(0)
  const linesKey = JSON.stringify(bag.lines)

  // Totals always come from the server: prices, stock, delivery fee and promo code are all re-checked there.
  useEffect(() => {
    if (!bag.ready || bag.lines.length === 0) return
    const mine = ++seq.current
    setQuoteFailed(false)
    quoteAction({ lines: bag.lines, deliveryMethodId: methodId, promoCode: promoCode || null })
      .then((q) => {
        if (mine !== seq.current) return
        setQuote(q)
        if (!methodId && q.options.length === 1) setMethodId(q.options[0].id)
      })
      .catch(() => mine === seq.current && setQuoteFailed(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bag.ready, linesKey, methodId, promoCode])

  if (!bag.ready) return <p className="muted">Loading checkout…</p>
  if (bag.lines.length === 0) {
    return (
      <div className="empty">
        <h2 className="display-sm">Your bag is empty</h2>
        <p className="soft">Add a suit to your bag before checking out.</p>
        <Link href="/shop" className="btn btn-gold">
          Shop suits
        </Link>
      </div>
    )
  }

  const selected = quote?.options.find((o) => o.id === methodId) ?? null
  const needsAddress = selected?.type === 'DELIVERY'
  const cartOk = quote ? quote.cart.itemCount > 0 && quote.cart.clean : false
  const set = (key: keyof typeof contact) => (e: { target: { value: string } }) => setContact((c) => ({ ...c, [key]: e.target.value }))
  const setAddr = (key: keyof Address) => (e: { target: { value: string } }) => setAddress((a) => ({ ...a, id: undefined, [key]: e.target.value }))
  const err = (key: string) => (errors[key] ? <span className="error">{errors[key]}</span> : null)

  const applyPromo = () => {
    setPromoCode(promoInput.trim().toUpperCase())
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!quote || submitting) return
    setSubmitting(true)
    setMessage('')
    setErrors({})
    try {
      const result = await placeOrderAction({
        ...contact,
        deliveryMethodId: methodId ?? '',
        promoCode: quote.promo?.ok ? promoCode : '',
        customerNote: note,
        expectedTotalCents: quote.totalCents,
        acceptTerms: terms,
        lines: bag.lines,
        address: needsAddress ? { line1: address.line1, line2: address.line2, suburb: address.suburb, city: address.city, province: address.province, postalCode: address.postalCode } : null,
      })
      if (result.ok) {
        // Hand over to Yoco's secure payment page. The bag is only emptied once payment is confirmed.
        window.location.assign(result.redirectUrl)
        return
      }
      setMessage(result.message)
      setErrors(result.fields ?? {})
      if (result.reviewBag) {
        // Refresh totals so the customer sees what changed.
        seq.current++
        quoteAction({ lines: bag.lines, deliveryMethodId: methodId, promoCode: promoCode || null }).then(setQuote).catch(() => {})
      }
      setSubmitting(false)
      requestAnimationFrame(() => document.getElementById('checkout-message')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    } catch {
      setMessage('Something went wrong and your order was not placed. Nothing has been charged. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="checkout" noValidate>
      <div>
        {testMode && paymentsReady && <p className="testmode" style={{ marginBottom: 22 }}>Test mode: payments are simulated and no money is taken.</p>}
        {!paymentsReady && (
          <div className="notice" style={{ marginBottom: 22 }}>
            <p>
              <strong>Online payment is not available yet.</strong> You can still review your order here. To buy now, message us and we will help you complete it.
            </p>
            {whatsappHref && (
              <p style={{ marginTop: 12 }}>
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-gold btn-sm">
                  <IconWhatsApp />
                  Order on WhatsApp
                </a>
              </p>
            )}
          </div>
        )}

        <section className="step">
          <h2 className="step-title">Your details</h2>
          <div className="form-row">
            <div className="field">
              <label htmlFor="co-first">First name</label>
              <input id="co-first" className="input" value={contact.firstName} onChange={set('firstName')} autoComplete="given-name" required aria-invalid={Boolean(errors.firstName) || undefined} />
              {err('firstName')}
            </div>
            <div className="field">
              <label htmlFor="co-last">Surname</label>
              <input id="co-last" className="input" value={contact.lastName} onChange={set('lastName')} autoComplete="family-name" required aria-invalid={Boolean(errors.lastName) || undefined} />
              {err('lastName')}
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="co-email">Email address</label>
              <input id="co-email" className="input" type="email" inputMode="email" value={contact.email} onChange={set('email')} autoComplete="email" required aria-invalid={Boolean(errors.email) || undefined} />
              <span className="hint">Your order confirmation is sent here.</span>
              {err('email')}
            </div>
            <div className="field">
              <label htmlFor="co-phone">Phone number</label>
              <input id="co-phone" className="input" type="tel" inputMode="tel" value={contact.phone} onChange={set('phone')} autoComplete="tel" required placeholder="082 123 4567" aria-invalid={Boolean(errors.phone) || undefined} />
              {err('phone')}
            </div>
          </div>
        </section>

        <section className="step">
          <h2 className="step-title">Delivery or collection</h2>
          {!quote && !quoteFailed && <p className="muted">Loading options…</p>}
          {quoteFailed && <p className="notice notice-error">We could not load your order. Check your connection and reload the page.</p>}
          {quote && quote.options.length === 0 && <p className="notice notice-error">No delivery or collection option is available right now. Please contact us to arrange your order.</p>}
          {quote && quote.options.length > 0 && (
            <div className="stack" style={{ gap: 10 }} role="radiogroup" aria-label="Delivery or collection">
              {quote.options.map((o) => (
                <label key={o.id} className="radio-card">
                  <span className="check">
                    <input type="radio" name="delivery" checked={methodId === o.id} onChange={() => setMethodId(o.id)} />
                  </span>
                  <span className="radio-card-body">
                    <span style={{ fontWeight: 600 }}>{o.name}</span>
                    {o.description && <small>{o.description}</small>}
                  </span>
                  <span className="price">{o.feeCents > 0 ? formatZAR(o.feeCents) : 'Free'}</span>
                </label>
              ))}
            </div>
          )}
          {err('deliveryMethodId')}

          {needsAddress && (
            <div className="form" style={{ marginTop: 8 }}>
              {addresses.length > 0 && (
                <div className="field">
                  <label htmlFor="co-saved">Saved addresses</label>
                  <select
                    id="co-saved"
                    className="select"
                    value={address.id ?? ''}
                    onChange={(e) => {
                      const found = addresses.find((a) => a.id === e.target.value)
                      setAddress(found ?? EMPTY_ADDRESS)
                    }}
                  >
                    <option value="">Use a different address</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.line1}, {a.suburb}, {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="field">
                <label htmlFor="co-line1">Street address</label>
                <input id="co-line1" className="input" value={address.line1} onChange={setAddr('line1')} autoComplete="address-line1" aria-invalid={Boolean(errors['address.line1']) || undefined} />
                {err('address.line1')}
              </div>
              <div className="field">
                <label htmlFor="co-line2">
                  Complex, building or unit <span className="muted">(optional)</span>
                </label>
                <input id="co-line2" className="input" value={address.line2} onChange={setAddr('line2')} autoComplete="address-line2" />
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="co-suburb">Suburb</label>
                  <input id="co-suburb" className="input" value={address.suburb} onChange={setAddr('suburb')} autoComplete="address-level3" aria-invalid={Boolean(errors['address.suburb']) || undefined} />
                  {err('address.suburb')}
                </div>
                <div className="field">
                  <label htmlFor="co-city">City or town</label>
                  <input id="co-city" className="input" value={address.city} onChange={setAddr('city')} autoComplete="address-level2" aria-invalid={Boolean(errors['address.city']) || undefined} />
                  {err('address.city')}
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="co-province">Province</label>
                  <select id="co-province" className="select" value={address.province} onChange={setAddr('province')} autoComplete="address-level1">
                    {SA_PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                  {err('address.province')}
                </div>
                <div className="field">
                  <label htmlFor="co-postal">Postal code</label>
                  <input id="co-postal" className="input" inputMode="numeric" maxLength={4} value={address.postalCode} onChange={setAddr('postalCode')} autoComplete="postal-code" aria-invalid={Boolean(errors['address.postalCode']) || undefined} />
                  {err('address.postalCode')}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="step" style={{ borderBottom: 0 }}>
          <h2 className="step-title">Anything else?</h2>
          <div className="field">
            <label htmlFor="co-note">
              Note for the store <span className="muted">(optional)</span>
            </label>
            <textarea id="co-note" className="textarea" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example who will collect the order, or the date you need it by." />
          </div>
        </section>
      </div>

      <aside className="panel checkout-summary stack">
        <h2 className="step-title">Order summary</h2>
        {quote ? (
          <>
            <ul>
              {quote.cart.lines.map((l) => (
                <li key={l.variantId} className="line" style={{ gridTemplateColumns: '58px 1fr', padding: '12px 0' }}>
                  <div className="line-media">{l.image && <Image src={l.image} alt="" fill sizes="58px" />}</div>
                  <div className="line-body">
                    <div className="line-top">
                      <span>{l.name}</span>
                      {l.quantity > 0 && <span className="price">{formatZAR(l.lineCents)}</span>}
                    </div>
                    {l.colour && (
                      <div className="line-meta">
                        {l.colour}, size {l.size}, quantity {l.quantity}
                      </div>
                    )}
                    {l.status !== 'ok' && <div className="error">No longer available as chosen.</div>}
                  </div>
                </li>
              ))}
            </ul>
            {!quote.cart.clean && (
              <p className="notice notice-error">
                Some items changed.{' '}
                <Link href="/cart" className="link">
                  Review your bag
                </Link>{' '}
                before paying.
              </p>
            )}

            <div className="field">
              <label htmlFor="co-promo">Promo code</label>
              <div className="newsletter" style={{ maxWidth: 'none' }}>
                <input
                  id="co-promo"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyPromo()
                    }
                  }}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
                <button type="button" onClick={applyPromo}>
                  Apply
                </button>
              </div>
              {quote.promo && !quote.promo.ok && <span className="error">{quote.promo.message}</span>}
              {quote.promo?.ok && (
                <span className="gold" style={{ fontSize: '0.84rem' }}>
                  Code {quote.promo.code} applied.{' '}
                  <button
                    type="button"
                    className="remove"
                    onClick={() => {
                      setPromoCode('')
                      setPromoInput('')
                    }}
                  >
                    Remove
                  </button>
                </span>
              )}
            </div>

            <div className="totals">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>{formatZAR(quote.subtotalCents)}</span>
              </div>
              {quote.discountCents > 0 && (
                <div className="totals-row">
                  <span>Discount</span>
                  <span>-{formatZAR(quote.discountCents)}</span>
                </div>
              )}
              <div className="totals-row">
                <span>{selected ? selected.name : 'Delivery or collection'}</span>
                <span>{selected ? (quote.deliveryCents > 0 ? formatZAR(quote.deliveryCents) : 'Free') : 'Choose an option'}</span>
              </div>
              <div className="totals-row totals-total">
                <span>Total to pay</span>
                <span>{formatZAR(quote.totalCents)}</span>
              </div>
              <p className="muted" style={{ fontSize: '0.78rem' }}>
                South African Rand (ZAR). VAT is included where applicable.
              </p>
            </div>
          </>
        ) : (
          <p className="muted">Calculating your order…</p>
        )}

        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>
            I accept the{' '}
            <Link href="/policies/terms" className="link" target="_blank">
              terms and conditions
            </Link>{' '}
            and have read the{' '}
            <Link href="/policies/returns-exchanges" className="link" target="_blank">
              returns policy
            </Link>{' '}
            and{' '}
            <Link href="/policies/privacy" className="link" target="_blank">
              privacy policy
            </Link>
            .
          </span>
        </label>

        {message && (
          <p id="checkout-message" className="notice notice-error" role="alert">
            {message}
          </p>
        )}

        <button type="submit" className="btn btn-gold btn-block" disabled={!paymentsReady || !quote || !cartOk || !selected || submitting}>
          {submitting ? <span className="spinner" aria-hidden /> : <IconLock />}
          {submitting ? 'Opening secure payment…' : quote && selected ? `Pay ${formatZAR(quote.totalCents)} with Yoco` : 'Pay with Yoco'}
        </button>
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          You will be taken to Yoco’s secure page to pay by card. We never see or store your card details. Your items are held for you while you pay.
        </p>
      </aside>
    </form>
  )
}
