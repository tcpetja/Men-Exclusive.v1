/**
 * Default page copy and policies.
 *
 * Everything here can be edited in Admin → Website content without a developer; an edit there overrides the
 * default below. Text is written in a small Markdown subset: "## Heading", "### Sub-heading", "- list item",
 * "1. numbered item", **bold** and [link text](/path).
 *
 * Placeholders such as {{address}} or {{email}} are filled in from Admin → Store settings. A line whose
 * placeholder has no value yet is left out, so nothing half-finished is ever shown.
 *
 * Brand copy is drawn from the MEN EXCLUSIVE company profile and brand guidelines.
 */

export type ContentDef = { key: string; label: string; help: string; group: string; multiline: boolean; body: string }

export const CONTENT_DEFAULTS: ContentDef[] = [
  // ───────────────────────── Homepage ─────────────────────────
  {
    key: 'home.intro',
    group: 'Homepage',
    label: 'Brand introduction',
    help: 'Short introduction under the hero.',
    multiline: true,
    body: `Dress to impress, because presence is everything. MEN EXCLUSIVE is a Johannesburg menswear house for men who dress with intention: suits chosen for their cut, their cloth and the way they carry a room, fitted in store by people who care how you leave.`,
  },
  {
    key: 'home.story',
    group: 'Homepage',
    label: 'Signature brand story',
    help: 'The jaguar and cheetah story on the homepage.',
    multiline: true,
    body: `Two cats shape everything we do. The black jaguar moves with quiet authority and never needs to announce itself. The cheetah is all line and poise, unmistakable at a glance. One stands for power and confidence, the other for elegance and distinction. A good suit should give a man both.`,
  },
  {
    key: 'home.craft',
    group: 'Homepage',
    label: 'Fabrics and craftsmanship teaser',
    help: 'Short paragraph that leads to the Fabrics & craftsmanship page.',
    multiline: true,
    body: `Every stitch, fabric and finish is selected with care. Before a suit reaches our floor we look at how the cloth handles, how the jacket holds its shape and how the details are finished, so that what you take home feels as good as it looks.`,
  },
  {
    key: 'home.fitting',
    group: 'Homepage',
    label: 'The fitting experience',
    help: 'Short paragraph that leads to appointment booking.',
    multiline: true,
    body: `Come in, try the suit on and let us look at it with you. We will guide you on colour, fit and combinations, and assess any adjustments needed so the suit sits properly on your shoulders and breaks cleanly at the shoe.`,
  },

  // ───────────────────────── Our story ─────────────────────────
  {
    key: 'story.body',
    group: 'Our story',
    label: 'Our story',
    help: 'Main text of the Our story page.',
    multiline: true,
    body: `## A suit is a statement of character

At MEN EXCLUSIVE a suit is more than clothing. It is a statement of character and style. Our goal is to deliver a menswear experience that leaves every man feeling confident and distinguished in every setting, whether he needs a sharp look for business or a striking outfit for a special occasion.

We pride ourselves on a personal experience. From the first consultation to the final fitting, every client is guided through the journey so that his suit reflects his own style and presence.

## Our mission

To deliver exceptional quality and personalised service through every garment.

- Premium craftsmanship with attention to every detail.
- Expert style consultations.
- Excellence, integrity and timeless design in all we do.

## Our vision

To become a symbol of sophistication, trust and excellence in menswear, and to inspire confidence through clothing. We want to offer the modern gentleman more than garments: an identity.

## The MEN EXCLUSIVE standard

Excellence is the foundation of everything we do. From the first look at the cloth to the final fitting, every detail should reflect sophistication, confidence and lasting quality.

- Expert tailoring and precision craftsmanship.
- Premium styling and personalised consultations.
- Integrity and professionalism in every transaction.
- A lasting impression with every garment.`,
  },
  {
    key: 'story.founder',
    group: 'Our story',
    label: 'Message from the founder',
    help: 'Founder message shown on the Our story page.',
    multiline: true,
    body: `Fifteen years ago, I started Men Exclusive with a simple vision: to create suits that empower men to look and feel their absolute best. What began as a small dream has grown into a brand dedicated to precision, elegance and timeless style.

My goal has always been to blend classic tailoring with modern sophistication, ensuring every client who walks through our doors experiences confidence, comfort and distinction. I believe that a suit is more than just clothing. It is a statement of who you are.

Thank you for being part of the Men Exclusive journey. I look forward to helping you discover your perfect style.`,
  },
  {
    key: 'story.founderName',
    group: 'Our story',
    label: 'Founder name and title',
    help: 'Shown under the founder message.',
    multiline: false,
    body: `Henock W, Founder of Men Exclusive`,
  },

  // ───────────────────────── Fabrics & craftsmanship ─────────────────────────
  {
    key: 'fabrics.intro',
    group: 'Fabrics & craftsmanship',
    label: 'Introduction',
    help: 'Opening paragraph.',
    multiline: true,
    body: `A suit earns its place in your wardrobe through its cloth and the way it is put together. This is what we look at before a suit reaches our floor, and what is worth knowing when you choose yours.`,
  },
  {
    key: 'fabrics.body',
    group: 'Fabrics & craftsmanship',
    label: 'What to look for',
    help: 'The guide to cloth and construction. Only state fabric facts you have confirmed.',
    multiline: true,
    body: `## Cloth

The cloth sets the tone of the suit. Look at how it drapes when the jacket hangs, how it feels in the hand and how it recovers after you crease it lightly. Plain weaves read as formal and versatile. Checks and windowpanes carry more personality and suit celebrations as well as the office.

Where the composition of a fabric has been confirmed, it is listed on the product page. If it is not listed, ask us and we will check the label for you.

## Structure

A jacket should stand on its own. The shoulder should sit flat and end where yours does, the chest should lie clean against the body and the lapel should roll rather than fold flat. Structure is what makes a jacket look as sharp at six in the evening as it did at eight in the morning.

## Lining

The lining lets the jacket slide on over a shirt and helps it keep its shape. Turn the jacket inside out when you try it on: the lining should lie smooth, with neat seams and no pulling at the vents or armholes.

## Buttons and finishing

Small things tell you how much care went into a suit. Buttons should be sewn firmly with a little shank so the cloth sits flat when fastened. Pockets should lie flat, and on a check or windowpane the pattern should meet cleanly across seams and pocket flaps.

## Comfort

A suit that fits well is comfortable. You should be able to lift your arms, sit down and button the jacket without strain. If something pulls, a different size or a small adjustment usually solves it. That is what fittings are for.`,
  },
  {
    key: 'fabrics.care',
    group: 'Fabrics & craftsmanship',
    label: 'Garment care',
    help: 'General care advice. The care label on each garment always takes priority.',
    multiline: true,
    body: `- Always follow the care label inside the garment first.
- Hang the jacket on a shaped, wide-shouldered hanger after every wear and let it air before it goes back in the wardrobe.
- Brush the suit with a soft clothes brush to lift dust instead of cleaning it after every wear.
- Use steam to release creases. Avoid pressing a hot iron directly onto the cloth.
- Dry clean only when the suit needs it, and clean the jacket and trousers together so they age evenly.
- Empty the pockets and keep the suit in a breathable garment bag when you travel.`,
  },

  // ───────────────────────── Fittings & alterations ─────────────────────────
  {
    key: 'fittings.intro',
    group: 'Fittings & alterations',
    label: 'Introduction',
    help: 'Opening paragraph.',
    multiline: true,
    body: `The difference between a suit that looks fine and a suit that looks like yours is the fit. Visit us for a fitting and we will look at the shoulders, the sleeve, the waist and the trouser length with you, and assess what can be adjusted.`,
  },
  {
    key: 'fittings.services',
    group: 'Fittings & alterations',
    label: 'Services',
    help: 'List only services you offer. Do not add prices or turnaround times unless they are confirmed.',
    multiline: true,
    body: `### Fitting assistance
Try your suit on in store with someone who knows what to look for. We check comfort, posture and proportion and help you find the right size.

### Fittings and adjustments
Minor alterations to keep the fit right. Tell us what needs attention, whether it is the sleeves, the jacket or the trousers, and we will assess what is possible once we have seen the garment on you.

### Personal styling
One-on-one guidance on colour, fit and combinations to build a look that suits your personality and the occasion.

### Wardrobe planning
Advice on coordinating outfits for weddings, corporate events and formal occasions, and on the essentials worth owning.

### Special occasion styling
Suit, accessories and a styling consultation planned together for weddings, galas and celebrations.`,
  },
  {
    key: 'fittings.note',
    group: 'Fittings & alterations',
    label: 'Note on cost and timing',
    help: 'Shown below the services.',
    multiline: true,
    body: `We confirm what can be done, what it will cost and how long it will take after we have assessed the garment. Nothing is altered until you have agreed.`,
  },

  // ───────────────────────── Policies ─────────────────────────
  {
    key: 'policy.delivery',
    group: 'Policies',
    label: 'Delivery and collection policy',
    help: 'Delivery options and prices themselves are managed under Admin → Delivery.',
    multiline: true,
    body: `This policy applies to orders placed on this website.

## Collection from our store

You can collect your order from MEN EXCLUSIVE at {{address}}. We will email you as soon as your order is ready. Please bring your order number and proof of identity. If someone else will collect for you, tell us beforehand and give them your order number.

## Delivery

The delivery options available for your order, what each one costs and when you can expect it are shown at checkout before you pay. If no delivery option is shown, delivery is not yet available online. Contact us and we will try to make an arrangement with you.

## If your order is late

If we cannot have your order ready or delivered when we said we would, we will tell you. Unless we agreed a different date with you, you may cancel an order that has not been delivered or made ready within 30 days of the day you placed it, by giving us seven days' written notice, and we will refund you in full.

If an item you paid for turns out to be unavailable, we will tell you immediately and refund you within 30 days.

## Risk and checking your order

Your order remains our responsibility until you, or the person you asked to receive it, accepts delivery or collects it. Please check your order when you receive it and tell us straight away if anything is missing, damaged or not what you ordered.

## Questions

Contact us on {{phone}} or {{email}} and quote your order number.`,
  },
  {
    key: 'policy.returns-exchanges',
    group: 'Policies',
    label: 'Returns and exchanges policy',
    help: 'Review with a legal adviser before launch. Do not remove the rights set out by the Consumer Protection Act and ECT Act.',
    multiline: true,
    body: `This policy applies to orders placed on this website. It explains the difference between changing your mind, exchanging an item, and returning something that is faulty. Nothing in it limits the rights you have under the Consumer Protection Act 68 of 2008 or the Electronic Communications and Transactions Act 25 of 2002.

## If you change your mind

You may cancel an online order, without giving a reason and without penalty, within 7 days after you receive it.

- Tell us within those 7 days that you are cancelling, and quote your order number.
- Return the item to our store or send it back to us. The only cost to you is the direct cost of returning it.
- Please return it unworn, unaltered and with its tags, in the condition you received it.
- We refund everything you paid for the returned item within 30 days of your cancellation.

This cooling-off right does not apply to a garment that has been altered or made to your measurements at your request, because it has been personalised for you. Your rights if such a garment is faulty are not affected.

## Exchanges

If the size or colour is not right, contact us within 7 days of receiving your order. We will gladly exchange it for another size or colour if we have it in stock. If we do not, you may choose another item or a refund.

## If something is faulty or not as described

Every item we sell must be of good quality, in good working order and free of defects. If it is not, you may return it to us within 6 months of receiving it, at our risk and expense, and choose whether we repair it, replace it or refund you.

If we repair an item and the same problem comes back within 3 months, we will replace it or refund you.

This does not cover damage caused by ordinary wear, accidents, misuse, or alterations made by someone else after you received the item.

## If we sent the wrong item

If what you received is not what you ordered, tell us and we will collect or accept it back at our cost and send you the correct item or refund you, whichever you prefer.

## How to return an item

Contact us on {{phone}} or {{email}} with your order number before sending anything back, so we can tell you how to return it and look out for it. You can also bring the item to our store at {{address}}.

## Bought in store?

This page covers online orders. If you bought in our store, please speak to our team. Your rights if an item is faulty are the same wherever you bought it.`,
  },
  {
    key: 'policy.refunds',
    group: 'Policies',
    label: 'Refund policy',
    help: 'Review with a legal adviser before launch.',
    multiline: true,
    body: `## How refunds are paid

Refunds are paid back to the card or payment method you used at checkout, through Yoco, our payment provider. We cannot refund to a different card or account. Once we issue a refund, banks usually take a few business days to show it on your statement.

## When you will be refunded

- **You cancelled within the 7-day cooling-off period:** we refund everything you paid for the returned item within 30 days of your cancellation. You pay only the direct cost of returning it.
- **The item was faulty or not as described:** if you choose a refund, we refund the price you paid once we have received the item.
- **We could not supply your order:** if an item is unavailable, or your order was not delivered or made ready in time and you cancel it, we refund you in full within 30 days.
- **You cancel before your order is dispatched or collected:** contact us as soon as possible and we will cancel the order and refund you in full.

## Partial refunds

If you return only part of an order, we refund the items returned.

## Questions about a refund

Contact us on {{phone}} or {{email}} and quote your order number. See also our [returns and exchanges policy](/policies/returns-exchanges).`,
  },
  {
    key: 'policy.privacy',
    group: 'Policies',
    label: 'Privacy policy',
    help: 'Review with a legal adviser before launch. Fill in your legal name and Information Officer under Store settings.',
    multiline: true,
    body: `MEN EXCLUSIVE respects your privacy and processes your personal information in line with the Protection of Personal Information Act 4 of 2013 (POPIA).

## Who we are

{{legalName}} is the responsible party for personal information collected through this website.

- Address: {{address}}
- Email: {{email}}
- Phone: {{phone}}
- Information Officer: {{informationOfficer}}

## What we collect

- **Details you give us:** your name, email address, phone number and delivery address when you order, create an account, request an appointment, subscribe to our newsletter or send us a message.
- **Order information:** what you bought, when, and how it was delivered or collected.
- **Account information:** your login email and an encrypted version of your password. We cannot see your password.
- **Technical information:** your IP address and basic device information, used to keep the site secure and working.

We do not receive or store your card number. Card details are entered on a secure page operated by Yoco, our payment provider.

## Why we use it

- To process and deliver your orders and keep you informed about them.
- To respond to enquiries and appointment requests.
- To manage your account and order history.
- To prevent fraud and keep the website secure.
- To keep the records the law requires of us.
- To send you news and offers, only if you have asked us to. You can unsubscribe at any time.

## Who we share it with

We share only what is needed, with:

- Yoco, to process your payment.
- Delivery partners, when you choose delivery.
- The companies that host this website and send our emails.
- WhatsApp, when you choose to contact us there.
- Google Analytics, only if you accept analytics cookies.

Some of these providers store information outside South Africa. Where that happens we rely on providers that protect it to a standard similar to POPIA. We do not sell your personal information.

## How long we keep it

We keep your information only for as long as we need it for the purposes above, or for as long as the law requires us to keep records of transactions. You can ask us to delete your account at any time.

## How we protect it

The website is encrypted (HTTPS), passwords are stored in hashed form, and access to customer information is limited to staff who need it.

## Your rights

You may ask us for a copy of the personal information we hold about you, ask us to correct or delete it, object to how we use it, and withdraw your consent to marketing. Contact us using the details above and we will respond within a reasonable time.

If you are not satisfied with our response you may complain to the Information Regulator of South Africa at [inforegulator.org.za](https://inforegulator.org.za) or POPIAComplaints@inforegulator.org.za.

## Children

If you are under 18, please ask a parent or guardian to place your order or make your enquiry for you.

## Changes

We may update this policy from time to time. The current version is always on this page.`,
  },
  {
    key: 'policy.terms',
    group: 'Policies',
    label: 'Terms and conditions',
    help: 'Review with a legal adviser before launch. Fill in your legal name and registration number under Store settings.',
    multiline: true,
    body: `These terms apply when you use this website and when you buy from it. Nothing in them limits the rights you have under South African law, including the Consumer Protection Act and the Electronic Communications and Transactions Act.

## About us

This website is operated by {{legalName}}.

- Registration number: {{registrationNumber}}
- VAT number: {{vatNumber}}
- Physical address: {{address}}
- Phone: {{phone}}
- Email: {{email}}

## Products and prices

- Prices are shown in South African Rand (ZAR) and include VAT where applicable. Delivery charges, if any, are shown at checkout before you pay.
- We photograph our garments as accurately as we can, but colours may look slightly different on your screen.
- Stock is limited. An item is held for you for a short time while you complete payment. If payment is not completed in time, the order is cancelled and the item is released.
- If a price is displayed incorrectly because of an obvious error, we will contact you before taking the order further, and you may cancel for a full refund.

## Orders and payment

- An order is confirmed when we receive confirmation of your payment and email you an order confirmation.
- Payments are processed securely by Yoco. We do not see or store your card details.
- You can place an order as a guest or through an account. You are responsible for keeping your account password private.

## Delivery, collection, returns and refunds

Please read our [delivery and collection policy](/policies/delivery), [returns and exchanges policy](/policies/returns-exchanges) and [refund policy](/policies/refunds). They form part of these terms.

## Appointments

A request made through this website or WhatsApp is a request only. Your appointment is confirmed once our team replies to you.

## Your information

We handle your personal information as described in our [privacy policy](/policies/privacy).

## Using this website

The content of this website, including the MEN EXCLUSIVE name, logo, photographs and text, belongs to us. Please do not copy or reuse it without our permission, or use the website in a way that could damage it or interfere with other customers.

## Complaints

If something has gone wrong, please contact us first on {{phone}} or {{email}} so that we can put it right. If we cannot resolve it, you may refer the matter to the Consumer Goods and Services Ombud at [cgso.org.za](https://www.cgso.org.za) or to the National Consumer Commission.

## Law

These terms are governed by the laws of the Republic of South Africa.

## Changes

We may update these terms from time to time. The version on this page when you place your order applies to that order.`,
  },
  {
    key: 'policy.cookies',
    group: 'Policies',
    label: 'Cookie policy',
    help: 'Update this if you add new tracking or marketing tools.',
    multiline: true,
    body: `Cookies are small files a website stores in your browser. We use as few as we can.

## Essential

These are needed for the website to work and cannot be switched off.

- **Sign-in:** keeps you signed in to your account.
- **Shopping bag:** your bag is saved in your browser so it is still there when you come back.
- **Cookie choice:** remembers whether you accepted or declined analytics.

## Analytics

If you accept, we use Google Analytics to understand which pages and products are popular so we can improve the website. It is switched off unless you accept, and the information is not used to identify you.

## Payment

When you pay, you are taken to a secure page operated by Yoco, which uses its own cookies to process your payment safely.

## Changing your choice

Clear this website's cookies in your browser settings and the cookie notice will appear again on your next visit.`,
  },
]

export const CONTENT_BY_KEY: Record<string, ContentDef> = Object.fromEntries(CONTENT_DEFAULTS.map((c) => [c.key, c]))
