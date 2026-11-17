# MEN EXCLUSIVE — online store

**Dress to impress.** A full e-commerce website for MEN EXCLUSIVE, the Johannesburg menswear boutique: product catalogue with size and colour stock, shopping bag, guest and account checkout, secure Yoco payments, order management, appointment requests, WhatsApp enquiries and an admin dashboard the owner can run without a developer.

Built for South Africa: prices in Rand, Yoco as the payment gateway, WhatsApp throughout, and policies written around the Consumer Protection Act, the ECT Act and POPIA.

---

## Contents

1. [What is included](#what-is-included)
2. [Before you go live](#before-you-go-live) (the owner's checklist)
3. [Platform choice](#platform-choice)
4. [Run it on your computer](#run-it-on-your-computer)
5. [Deploy](#deploy)
6. [Connect Yoco](#connect-yoco)
7. [Connect email](#connect-email)
8. [Using the admin](#using-the-admin)
9. [How payments are kept safe](#how-payments-are-kept-safe)
10. [Project layout, scripts and tests](#project-layout-scripts-and-tests)
11. [Room to grow](#room-to-grow)

---

## What is included

**Storefront**

- Homepage with the brief's hero (“Command the room. Define your presence.”), shop by occasion, featured collection, brand story, fabrics, the fitting experience, store information and newsletter sign-up. New arrivals, best sellers and testimonials appear as soon as the owner adds them.
- Shop with filters for suit type, colour, size, price and availability, plus sorting and search.
- Product pages with a photo gallery, colour and size selection, per-size stock, “only 1 left” notices, specifications, and WhatsApp buttons prefilled with the product name and reference.
- Seven occasion pages (corporate, matric dance, graduation, weddings, formal and black tie, business travel, special occasions), each with its suits and plain-language styling advice.
- Fabrics & craftsmanship, Our story, Fittings & alterations, Contact, and six policy pages.
- Appointment request form with a WhatsApp follow-up. It states clearly that a request is only confirmed once the store replies.
- Mobile-first throughout, with a slide-in menu and bag.

**Buying**

- Bag saved on the customer's device; prices and stock are always re-checked on the server.
- Guest checkout or account checkout, collection or delivery, promo codes, a clear total before payment.
- Yoco Checkout API: the customer pays on Yoco's secure page. Card details never touch this website.
- Order confirmation page and emails, with a private link so guests can follow their order.
- Customer accounts: register, sign in, reset password, details, saved addresses, order history. A guest can create an account straight after buying and keep that order.

**Admin dashboard** (`/admin`)

- Overview with a live “before you go live” checklist.
- Products: photos (upload from a phone), price, colours, sizes, stock per size, occasions, featured / new arrival / best seller flags.
- Orders: payment status, customer and delivery details, status updates that email the customer, tracking numbers, refunds through Yoco, internal notes and a full history.
- Appointments, enquiries, customers, newsletter export.
- Delivery and collection options with fees, promo codes, announcement bar, testimonials.
- Every page's wording and all policies, and all store details (contact numbers, address, hours, legal details, analytics).

---

## Before you go live

Nothing about the business has been invented. Where the owner has not yet confirmed something, the site leaves it out or asks the customer to enquire. The admin overview tracks this list for you.

| To confirm | Why it matters | Where |
| --- | --- | --- |
| **Prices, sizes and stock for each suit** | The 14 suits from the store photographs are loaded with their photos and visible details only. Each shows “Price on request” with a WhatsApp enquiry button and **cannot be bought online until it has a price and at least one size in stock**. | Admin → Products and stock |
| **Product details** | Fabric composition, fit and care instructions are left empty. Names, descriptions and occasion tags were written from the photographs; check them. Also confirm whether the shirt, tie and accessories shown are included. | Admin → Products and stock |
| **WhatsApp number** | Set to +27 63 051 2118 from the company profile. The profile also lists +27 81 091 6547. Confirm which is the official WhatsApp number and send a test message. | Admin → Store settings |
| **Trading hours** | Not provided, so the site does not show any. | Admin → Store settings |
| **Delivery options, fees and times** | Only “Collect from our Johannesburg store” (free) is switched on. A courier option exists but is switched off until a fee and timing are confirmed. | Admin → Delivery and collection |
| **Registered business name, registration and VAT numbers, Information Officer** | The ECT Act requires an online store to display these. | Admin → Store settings |
| **Policies** | Delivery, returns, refund, privacy, terms and cookie policies follow the CPA, ECT Act and POPIA, but they are templates. Have them reviewed. | Admin → Website content |
| **Services** | The fittings page lists the services described in the company profile. Remove anything not offered. No prices or turnaround times are stated. | Admin → Website content |
| **Testimonials, new arrivals, best sellers** | None are invented. Those sections stay hidden until you add real ones. | Admin |
| **Yoco live keys and verified domain** | Needed before real payments can be taken. | [Connect Yoco](#connect-yoco) |
| **Email sending** | Needed for order confirmations and password resets. | [Connect email](#connect-email) |

The founder's message and “fifteen years” on the Our story page are taken from the company profile. The three team members in that profile looked like template placeholders, so they were left out.

---

## Platform choice

The brief asked for WooCommerce, Shopify, Wix and custom development to be weighed up before choosing.

| | WooCommerce | Shopify | Wix | Custom (this repository) |
| --- | --- | --- | --- | --- |
| Yoco | Official Yoco plugin | Check Yoco's current list of supported platforms before relying on it | Check Yoco's current list | Yoco Checkout API, integrated directly |
| Monthly cost | Hosting, plus paid plugins as needs grow | Subscription, plus apps | Subscription | Hosting and database, both with free starting tiers |
| Design freedom | Limited by the theme unless custom-built | Limited by the theme | Most limited | Complete |
| Day-to-day admin | Powerful but busy; needs plugin and security updates | Very easy | Very easy | Purpose-built for this store, only what the owner needs |
| Speed on mobile data | Depends heavily on theme and plugins | Good | Average | Very good, nothing unused is loaded |
| Size and colour stock | Yes | Yes | Yes | Yes, per size of each colour |
| Appointments and WhatsApp flows | Extra plugins | Extra apps | Built-in bookings, limited WhatsApp | Built in, tailored to the brief |
| Who maintains it | Someone must keep WordPress and plugins patched | Shopify | Wix | A developer for new features; the owner for content |

**Decision: custom build**, using mainstream, well-supported tools (Next.js, PostgreSQL, Prisma). The brief's brand experience, per-size stock rules, WhatsApp flows and appointment requests fit poorly into a theme, and the Yoco Checkout API gives a direct integration with nothing in between. The trade-off is honest: new features need a developer. If the owner would rather never involve one, **WooCommerce with the official Yoco plugin is the alternative to choose**, at the cost of the tailored design.

---

## Run it on your computer

You need Node.js 20.9 or newer and a PostgreSQL database (Docker makes that one command).

```bash
npm install
docker compose up -d db          # starts PostgreSQL locally
cp .env.example .env             # then set DATABASE_URL to the local address shown in docker-compose.yml
npm run db:migrate               # creates the tables
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long password' npm run db:seed
npm run dev                      # http://localhost:3000   (admin at /admin)
```

To rehearse a purchase without a Yoco account, uncomment the three “local development only” lines in `.env`, then run `npm run yoco:mock` in a second terminal. Checkout will send you to a plain test page that approves or declines the payment and sends the website a properly signed webhook, exactly as Yoco does.

---

## Deploy

### Recommended: Vercel with a Neon database

Both have free starting tiers and need no server maintenance.

1. Create a Vercel account and import this GitHub repository as a new project.
2. In the project, open **Storage → Create Database → Neon (Postgres)** and choose a European region (Frankfurt). The site's functions are pinned to Frankfurt in `vercel.json` so the two sit side by side; Neon has no African region yet. Vercel adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you.
3. Add the remaining settings from `.env.example` under **Settings → Environment Variables**: `SITE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`, the `YOCO_…` values and the `SMTP_…` values.
4. Deploy. Each deployment applies database migrations, adds any missing starter records (never overwriting your edits) and builds the site.
5. Add your domain under **Settings → Domains**, set `SITE_URL` to it, and redeploy.
6. Sign in at `/account/login` with the admin email and password, then change the password under **Your details**.

### Alternative: your own server with Docker

For hosting in South Africa (lowest latency for local customers) or anywhere else:

```bash
cp .env.example .env             # fill it in; DATABASE_URL is set for you by docker-compose
docker compose --profile site up -d --build
```

Put a reverse proxy with HTTPS (Caddy or nginx) in front of port 3000, and back up the `dbdata` volume. Product photographs uploaded in the admin are stored in the database, so one database backup covers everything.

To release stock held by abandoned checkouts on a schedule, call `GET /api/cron/expire-orders` with the header `Authorization: Bearer <CRON_SECRET>`. Vercel does this daily by itself. The site also does it as people browse, so this is a safety net.

---

## Connect Yoco

Official reference: <https://developer.yoco.com> (Checkout API) and <https://support.yoco.help/en/articles/739322-yoco-checkout-api>.

**Test first**

1. In the Yoco app, open the Checkout API integration and copy the **test** secret key (`sk_test_…`) into `YOCO_TEST_SECRET_KEY`. Keep `YOCO_MODE=test`.
2. Register the webhook, using your real site address:
   ```bash
   npm run yoco:webhook register https://www.your-domain.co.za/api/webhooks/yoco
   ```
   Copy the `whsec_…` secret it prints into `YOCO_TEST_WEBHOOK_SECRET`. Yoco shows it only once.
3. Redeploy and place a test order using the test card details shown in the Yoco app. The checkout page shows a “Test mode” notice, and the order should move to **Paid** within a few seconds.

**Go live**

1. In the Yoco app, add and verify your website domain. Yoco keeps the live keys locked until a domain is verified.
2. Copy the **live** secret key (`sk_live_…`) into `YOCO_LIVE_SECRET_KEY`.
3. Set `YOCO_MODE=live` in your shell and run the webhook command again; put the new secret in `YOCO_LIVE_WEBHOOK_SECRET`.
4. Set `YOCO_MODE=live` in the hosting environment and redeploy. Place one small real order and refund it from the admin to confirm the whole loop.

Keys are only ever read from the hosting environment. They are never stored in the database, shown in the admin, or sent to the browser. A test key is refused in live mode and a live key in test mode.

Notes from Yoco's documentation: amounts are in cents and ZAR only, the minimum payment is R2, refunds are not available in test mode, and Yoco supports Visa and Mastercard plus Apple Pay and Google Pay on its payment page.

---

## Connect email

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM`. Any SMTP provider works. A transactional provider (Brevo, Mailgun, Amazon SES, Postmark) with your own domain delivers far more reliably than a Gmail address; if you do use Gmail, create an app password.

Until email is connected the site still works, but customers receive no confirmations or password-reset links. The admin shows a warning, and every order's history records whether each email was sent.

---

## Using the admin

Sign in at `/account/login` with an admin account, then open `/admin`. Create further admins with:

```bash
npm run admin:create -- name@example.com "a long password"
```

- **To put a suit on sale:** Products and stock → open the suit → enter the price → add sizes (type `46, 48, 50` and press Add sizes) → enter the stock for each → Save. The message under the form tells you whether customers can now buy it.
- **When you add a photograph:** click it on the middle of the suit. The shop frames every photograph on that point and lets the background fade away, so the suit is what customers see. The product page still shows the full, untouched photograph.
- **When an order arrives:** Orders → open it → choose the next step (start preparing, ready for collection or dispatched, then collected or delivered). The customer is emailed each time.
- **To refund:** open the order → Refund. A full refund of an order that has not left the store puts its items back into stock automatically.
- **Orders marked “Needs attention”:** something unusual happened with a payment (for example a payment for the wrong amount, or a payment that arrived after the items were sold to someone else). The order explains what to do.

---

## How payments are kept safe

- The order total is calculated on the server from the database. Nothing the browser sends can change a price.
- Stock is held the moment an order is placed, using a conditional database update, so two people cannot buy the last suit in a size. Unpaid orders release their stock after 60 minutes (adjustable in Store settings).
- An order becomes **Paid** only when Yoco's signed webhook arrives and its signature, timestamp, amount, currency and mode all check out. Returning from the payment page is never treated as proof of payment.
- Webhook deliveries are recorded, so a repeated delivery cannot pay or refund an order twice.
- Passwords are hashed with scrypt. Sessions are random tokens stored as hashes in secure, HTTP-only cookies. Sign-in, password reset, checkout and public forms are rate-limited.
- No card data is stored or handled by this website at any point.

---

## Project layout, scripts and tests

```
prisma/schema.prisma        data model            prisma/seed.ts   starter catalogue from the store photos
src/app/(store)/            storefront pages      src/app/admin/   admin dashboard
src/app/actions/            server actions (shop, account, public forms, admin)
src/app/api/webhooks/yoco/  Yoco webhook          src/lib/yoco.ts  Yoco client and signature check
src/lib/orders.ts           totals, stock holds, payment and refund handling
src/content/defaults.ts     default page copy and policies (editable in the admin)
scripts/                    create-admin, yoco-webhook, mock-yoco (local only)
```

| Command | What it does |
| --- | --- |
| `npm run dev` / `npm run build` / `npm start` | Develop, build, run |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations / add starter records |
| `npm run admin:create -- email "password"` | Create or promote an admin |
| `npm run yoco:webhook list\|register\|delete` | Manage the Yoco webhook |
| `npm run yoco:mock` | Local stand-in for Yoco, for rehearsing checkout |
| `npm test` | Unit tests (webhook signatures, key separation, money, WhatsApp links, passwords) |
| `npm run test:payments` | Payment edge cases against a running site in test mode |
| `npm run typecheck` | TypeScript check |

---

## Room to grow

The data model and structure leave space for the brief's later phases: loyalty and customer retention (orders are already tied to accounts), saved size profiles (extend `User`), group and corporate orders (extend `Order`), gift cards and further payment options (payments are isolated in `src/lib/yoco.ts` and `src/lib/orders.ts`), richer stock reports (stock lives on `Variant`, every change to an order is logged in `OrderEvent`), and in-store point-of-sale stock syncing.
