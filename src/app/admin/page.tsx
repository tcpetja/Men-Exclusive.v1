import Link from 'next/link'
import { orderStatusLabel } from '@/lib/constants'
import { db } from '@/lib/db'
import { emailConfigured } from '@/lib/email'
import { formatZAR } from '@/lib/money'
import { expireStaleOrders } from '@/lib/orders'
import { getSettings, siteUrl } from '@/lib/settings'
import { yocoConfig } from '@/lib/yoco'

type Check = { state: 'ok' | 'todo' | 'bad'; text: string; href?: string; linkLabel?: string }

export default async function AdminHome() {
  await expireStaleOrders().catch(() => 0)
  const settings = await getSettings()
  const yoco = yocoConfig()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000)

  const [toFulfil, attention, newAppointments, newEnquiries, activeProducts, noPrice, noSizes, sellable, lowStock, activeDelivery, paid30, recent, testimonials] = await Promise.all([
    db.order.count({ where: { status: { in: ['PAID', 'PROCESSING'] } } }),
    db.order.count({ where: { needsAttention: { not: null } } }),
    db.appointment.count({ where: { status: 'NEW' } }),
    db.enquiry.count({ where: { status: 'NEW' } }),
    db.product.count({ where: { isActive: true } }),
    db.product.count({ where: { isActive: true, priceCents: null } }),
    db.product.count({ where: { isActive: true, colours: { none: { variants: { some: {} } } } } }),
    db.product.count({ where: { isActive: true, priceCents: { not: null }, colours: { some: { variants: { some: { stock: { gt: 0 } } } } } } }),
    db.variant.count({ where: { stock: { lte: 1 }, colour: { product: { isActive: true } } } }),
    db.deliveryMethod.count({ where: { isActive: true } }),
    db.order.aggregate({ where: { paidAt: { gte: thirtyDaysAgo }, status: { notIn: ['CANCELLED', 'REFUNDED', 'PENDING_PAYMENT'] } }, _sum: { totalCents: true }, _count: true }),
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    db.testimonial.count({ where: { isPublished: true } }),
  ])

  const local = /localhost|127\.0\.0\.1/.test(siteUrl())
  const checks: Check[] = [
    yoco.secretKey && yoco.webhookSecret
      ? yoco.mode === 'live'
        ? { state: 'ok', text: 'Yoco is connected in live mode. The website can take real payments.' }
        : { state: 'todo', text: 'Yoco is connected in TEST mode. Payments are simulated and no money is taken. Switch to live keys when you are ready to sell.' }
      : { state: 'bad', text: `Online payment is switched off because Yoco is not fully set up (${yoco.mode} mode). ${yoco.problems.join(' ')}` },
    emailConfigured()
      ? { state: 'ok', text: 'Email is connected. Order confirmations and password resets will be sent.' }
      : { state: 'bad', text: 'Email is not connected, so customers will not receive order confirmations or password reset links. Add the SMTP settings to the hosting environment.' },
    local ? { state: 'todo', text: 'The website address (SITE_URL) is still set to a local address. Set it to your real domain so payment and email links work.' } : { state: 'ok', text: `Website address: ${siteUrl()}` },
    sellable > 0
      ? { state: 'ok', text: `${sellable} of ${activeProducts} products can be bought online.` }
      : { state: 'bad', text: 'No product can be bought online yet. Each product needs a price and at least one size in stock.', href: '/admin/products', linkLabel: 'Add prices and stock' },
    ...(noPrice > 0 ? [{ state: 'todo', text: `${noPrice} ${noPrice === 1 ? 'product shows' : 'products show'} "Price on request" because no price has been entered.`, href: '/admin/products?show=no-price', linkLabel: 'Enter prices' } as Check] : []),
    ...(noSizes > 0 ? [{ state: 'todo', text: `${noSizes} ${noSizes === 1 ? 'product has' : 'products have'} no sizes or stock yet.`, href: '/admin/products?show=no-sizes', linkLabel: 'Add sizes and stock' } as Check] : []),
    activeDelivery > 0
      ? { state: 'ok', text: `${activeDelivery} delivery or collection ${activeDelivery === 1 ? 'option is' : 'options are'} available at checkout.`, href: '/admin/delivery', linkLabel: 'Review' }
      : { state: 'bad', text: 'No delivery or collection option is switched on, so customers cannot check out.', href: '/admin/delivery', linkLabel: 'Set up delivery' },
    settings.hours ? { state: 'ok', text: 'Trading hours are shown on the website.' } : { state: 'todo', text: 'Trading hours have not been entered, so the website does not show them.', href: '/admin/settings', linkLabel: 'Add trading hours' },
    settings.legalName && settings.registrationNumber
      ? { state: 'ok', text: 'Legal business details are shown in the terms and footer.' }
      : { state: 'todo', text: 'Add the registered business name and registration number. South African law (ECT Act) requires online stores to display them.', href: '/admin/settings', linkLabel: 'Add business details' },
    { state: 'todo', text: `Confirm that ${settings.whatsapp} is the official WhatsApp number and test a message from the website.`, href: '/admin/settings', linkLabel: 'Check number' },
    { state: 'todo', text: 'Have the delivery, returns, refund, privacy and terms pages reviewed before launch. They are written to follow the CPA, ECT Act and POPIA, but they are templates.', href: '/admin/content', linkLabel: 'Review policies' },
    ...(testimonials === 0 ? [{ state: 'todo', text: 'No testimonials are published, so that section is hidden on the homepage. Add real customer feedback when you have it.', href: '/admin/testimonials', linkLabel: 'Add testimonials' } as Check] : []),
  ]
  const fmt = new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' })

  return (
    <>
      <div className="a-head">
        <div>
          <h1 className="a-title">Overview</h1>
          <p className="a-sub">What needs your attention today.</p>
        </div>
        <Link href="/admin/products/new" className="a-btn a-btn-primary">
          Add a product
        </Link>
      </div>

      <div className="a-stats">
        <Link href="/admin/orders?status=to-fulfil" className="a-stat">
          <b>{toFulfil}</b>
          <span>Orders to prepare</span>
        </Link>
        <Link href="/admin/orders?status=attention" className="a-stat">
          <b>{attention}</b>
          <span>Orders needing attention</span>
        </Link>
        <Link href="/admin/appointments" className="a-stat">
          <b>{newAppointments}</b>
          <span>New appointment requests</span>
        </Link>
        <Link href="/admin/enquiries" className="a-stat">
          <b>{newEnquiries}</b>
          <span>New enquiries</span>
        </Link>
        <Link href="/admin/products?show=low-stock" className="a-stat">
          <b>{lowStock}</b>
          <span>Sizes with 1 or 0 left</span>
        </Link>
        <div className="a-stat">
          <b>{formatZAR(paid30._sum.totalCents ?? 0)}</b>
          <span>
            Paid orders, last 30 days ({paid30._count})
          </span>
        </div>
      </div>

      <div className="a-grid a-grid-2">
        <section className="a-card">
          <h2>Recent orders</h2>
          {recent.length === 0 ? (
            <p className="a-empty">No orders yet. They will appear here as soon as a customer checks out.</p>
          ) : (
            <div className="a-table-wrap" style={{ marginTop: 10 }}>
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th className="a-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.number}`}>{o.number}</Link>
                        <div className="a-meta">{fmt.format(o.createdAt)}</div>
                      </td>
                      <td>
                        {o.firstName} {o.lastName}
                      </td>
                      <td>
                        <StatusPill status={o.status} fulfilment={o.fulfilmentType} />
                      </td>
                      <td className="a-num">{formatZAR(o.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="a-card">
          <h2>Before you go live</h2>
          <p className="a-help">The website checks these for you. Green items are done.</p>
          <ul className="a-list">
            {checks.map((c, i) => (
              <li key={i}>
                <span className={`a-dot ${c.state === 'ok' ? 'a-dot-ok' : c.state === 'bad' ? 'a-dot-bad' : ''}`} aria-hidden />
                <span>
                  <span className="sr-only">{c.state === 'ok' ? 'Done: ' : c.state === 'bad' ? 'Needs fixing: ' : 'To do: '}</span>
                  {c.text} {c.href && <Link href={c.href}>{c.linkLabel}</Link>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function StatusPill({ status, fulfilment }: { status: Parameters<typeof orderStatusLabel>[0]; fulfilment: 'COLLECTION' | 'DELIVERY' }) {
  const tone = status === 'CANCELLED' || status === 'REFUNDED' ? 'a-pill-bad' : status === 'PENDING_PAYMENT' ? 'a-pill-warn' : 'a-pill-ok'
  return <span className={`a-pill ${tone}`}>{orderStatusLabel(status, fulfilment)}</span>
}
