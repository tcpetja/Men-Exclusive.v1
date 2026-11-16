/**
 * Seeds the catalogue with the suits photographed in the MEN EXCLUSIVE store.
 *
 * IMPORTANT: only what is visible in the photographs is recorded here (style, colour, pieces shown).
 * Prices, sizes, stock, fabric composition and care details are NOT invented. Each product starts as
 * "Price on request" and cannot be bought online until the owner enters a price, sizes and stock in the admin.
 *
 * Safe to run more than once: existing records are left as they are, so admin edits are never overwritten.
 */
import 'dotenv/config'
import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/password'

const categories = [
  { slug: 'three-piece-suits', name: 'Three-piece suits', description: 'Jacket, waistcoat and trousers.', sortOrder: 1 },
  { slug: 'double-breasted-suits', name: 'Double-breasted suits', description: 'Peak lapels and a wrapped front.', sortOrder: 2 },
  { slug: 'single-breasted-suits', name: 'Single-breasted suits', description: 'The versatile classic.', sortOrder: 3 },
  { slug: 'accessories', name: 'Accessories', description: 'Ties, pocket squares, cufflinks and lapel flowers.', sortOrder: 4 },
]

const occasions = [
  {
    slug: 'corporate-business',
    name: 'Corporate and business',
    tagline: 'For the boardroom, the interview and the client meeting.',
    intro:
      'Business dress should make people listen before you speak. Choose a suit in a dark or neutral colour that fits cleanly through the shoulders, and let the details do the talking.',
    stylingNotes: `- Navy, charcoal and black are the most versatile choices for work.
- A subtle check or windowpane adds character without losing authority.
- Wear a white or pale blue shirt and a plain or finely patterned tie.
- A waistcoat lets you take your jacket off and still look finished.
- Keep shoes dark and polished, and match your belt to them.`,
    sortOrder: 1,
  },
  {
    slug: 'matric-dance',
    name: 'Matric dance',
    tagline: 'One night, one entrance. Make it count.',
    intro:
      'Your matric dance is the night to stand out. This is the place for colour, a sharp double-breasted jacket or a three-piece that photographs beautifully next to your partner.',
    stylingNotes: `- Do not be afraid of colour. Blush, green, ivory and rust all look striking under evening light.
- Tell us what colour your partner is wearing and we will help you complement it.
- A three-piece or double-breasted suit looks sharp in photographs.
- Book your fitting early so there is time for any adjustments before the night.
- Parents and guardians are welcome at the fitting.`,
    sortOrder: 2,
  },
  {
    slug: 'graduation',
    name: 'Graduation',
    tagline: 'You earned the moment. Dress for it.',
    intro:
      'A graduation suit sits under a gown for the ceremony and has to look good on its own afterwards. Choose something you will wear again to interviews and your first day at work.',
    stylingNotes: `- Navy and grey suits work under any academic gown and long after the ceremony.
- A lighter or patterned suit makes for memorable photographs.
- Wear a collared shirt so the hood sits neatly.
- Choose comfortable shoes. Graduation days involve a lot of standing.`,
    sortOrder: 3,
  },
  {
    slug: 'weddings',
    name: 'Weddings',
    tagline: 'For the groom, the groomsmen and the best-dressed guest.',
    intro:
      'Whether you are the one getting married or standing next to him, a wedding suit should feel special and fit perfectly. We can help with a single suit or coordinate the whole wedding party.',
    stylingNotes: `- Grooms: ivory, black and deep green photograph beautifully. A three-piece adds occasion.
- Groomsmen: choose one colour for everyone and let the groom stand apart in the details.
- Guests: softer colours and checks suit daytime weddings; darker suits suit the evening.
- Getting married soon? Start early so there is time for fittings and adjustments.
- Message us about group fittings for the wedding party.`,
    sortOrder: 4,
  },
  {
    slug: 'formal-black-tie',
    name: 'Formal and black tie',
    tagline: 'Galas, award evenings and formal dinners.',
    intro:
      'When the invitation says formal, keep it classic. A black suit, a crisp white shirt and careful grooming never fail. If the invitation says black tie, ask us what is expected and we will guide you.',
    stylingNotes: `- Black is the safest choice for formal evening events.
- Wear a plain white shirt and keep accessories simple.
- A waistcoat adds formality and keeps the look sharp when you sit down.
- Shoes should be black and well polished.`,
    sortOrder: 5,
  },
  {
    slug: 'business-travel',
    name: 'Business travel',
    tagline: 'Arrive looking like you did not just land.',
    intro:
      'A good travel suit works across several meetings and more than one outfit. Dark colours and subtle patterns hide the journey and mix easily with what is already in your bag.',
    stylingNotes: `- Dark suits and subtle checks show creases and marks less.
- A three-piece gives you several looks from one suit: with or without the waistcoat, or the jacket with other trousers.
- Carry the suit in a garment bag and hang it up as soon as you arrive.
- Steam from a hot shower helps creases drop out overnight.`,
    sortOrder: 6,
  },
  {
    slug: 'special-occasions',
    name: 'Special occasions',
    tagline: 'Birthdays, anniversaries, church and celebrations.',
    intro:
      'Some days simply deserve a great suit. For celebrations, choose the colour or cut that makes you feel most like yourself, and let us help you finish the look.',
    stylingNotes: `- Celebrations are the time for colour and pattern.
- A double-breasted jacket makes a confident statement.
- Pick one accent colour for your tie or pocket square and repeat it once.
- Not sure what suits the event? Send us the details on WhatsApp.`,
    sortOrder: 7,
  },
]

type SeedProduct = {
  slug: string
  sku: string
  name: string
  category: string
  summary: string
  description: string
  specs: string
  colour: { name: string; hex: string; family: string }
  images: { file: string; alt: string; width: number; height: number }[]
  occasions: string[]
  featured?: boolean
}

const STYLED = 'Shirt, tie and accessories are shown for styling.'
const ASK = 'Message us on WhatsApp for available sizes and fitting options.'

const products: SeedProduct[] = [
  {
    slug: 'black-three-piece-suit-scoop-waistcoat',
    sku: 'ME-S-001',
    name: 'Black three-piece suit with scoop waistcoat',
    category: 'three-piece-suits',
    summary: 'A black three-piece with a low, scooped waistcoat.',
    description: `A black three-piece suit: single-breasted jacket with a notch lapel, a low scooped waistcoat and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces: Jacket, waistcoat and trousers\nJacket: Single-breasted, notch lapel\nWaistcoat: Scooped front',
    colour: { name: 'Black', hex: '#161616', family: 'black' },
    images: [{ file: 'black-three-piece-suit-scoop-waistcoat.jpg', alt: 'Black three-piece suit with a scooped waistcoat, worn with a white shirt', width: 960, height: 1280 }],
    occasions: ['formal-black-tie', 'weddings', 'matric-dance'],
    featured: true,
  },
  {
    slug: 'ivory-double-breasted-suit',
    sku: 'ME-S-002',
    name: 'Ivory double-breasted suit',
    category: 'double-breasted-suits',
    summary: 'An ivory double-breasted suit with peak lapels.',
    description: `An ivory double-breasted suit with peak lapels, flap pockets and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces shown: Jacket and trousers\nJacket: Double-breasted, peak lapel',
    colour: { name: 'Ivory', hex: '#efe6d6', family: 'ivory' },
    images: [{ file: 'ivory-double-breasted-suit.jpg', alt: 'Ivory double-breasted suit with a white shirt and burgundy tie', width: 960, height: 1280 }],
    occasions: ['weddings', 'matric-dance', 'special-occasions'],
    featured: true,
  },
  {
    slug: 'navy-rust-windowpane-three-piece-suit',
    sku: 'ME-S-003',
    name: 'Navy and rust windowpane three-piece suit',
    category: 'three-piece-suits',
    summary: 'A dark navy three-piece with a rust windowpane check.',
    description: `A three-piece suit in dark navy with a rust windowpane check: single-breasted jacket, matching waistcoat and trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces: Jacket, waistcoat and trousers\nJacket: Single-breasted, notch lapel\nPattern: Windowpane check',
    colour: { name: 'Navy with rust check', hex: '#2b2d3d', family: 'blue' },
    images: [
      { file: 'navy-rust-windowpane-three-piece-suit.jpg', alt: 'Navy three-piece suit with a rust windowpane check, white shirt and navy tie', width: 926, height: 1280 },
      { file: 'navy-rust-windowpane-three-piece-suit-2.jpg', alt: 'The navy and rust windowpane three-piece suit seen from the side', width: 960, height: 1280 },
    ],
    occasions: ['corporate-business', 'business-travel', 'graduation'],
    featured: true,
  },
  {
    slug: 'forest-green-three-piece-suit',
    sku: 'ME-S-004',
    name: 'Forest green three-piece suit',
    category: 'three-piece-suits',
    summary: 'A deep green three-piece with a scooped waistcoat.',
    description: `A deep forest green three-piece suit: single-breasted jacket, scooped waistcoat and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces: Jacket, waistcoat and trousers\nJacket: Single-breasted, notch lapel\nWaistcoat: Scooped front',
    colour: { name: 'Forest green', hex: '#2f4a45', family: 'green' },
    images: [{ file: 'forest-green-three-piece-suit.jpg', alt: 'Forest green three-piece suit with a black shirt', width: 960, height: 1280 }],
    occasions: ['weddings', 'matric-dance', 'special-occasions', 'formal-black-tie'],
    featured: true,
  },
  {
    slug: 'stone-check-three-piece-suit',
    sku: 'ME-S-005',
    name: 'Stone check three-piece suit',
    category: 'three-piece-suits',
    summary: 'A light stone check three-piece.',
    description: `A three-piece suit in a light stone check: single-breasted jacket, scooped waistcoat and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces: Jacket, waistcoat and trousers\nJacket: Single-breasted, notch lapel\nPattern: Check',
    colour: { name: 'Stone check', hex: '#b9b1a6', family: 'grey' },
    images: [{ file: 'stone-check-three-piece-suit.jpg', alt: 'Light stone check three-piece suit with a black shirt', width: 894, height: 1280 }],
    occasions: ['corporate-business', 'graduation', 'weddings', 'special-occasions'],
    featured: true,
  },
  {
    slug: 'cocoa-double-breasted-suit',
    sku: 'ME-S-006',
    name: 'Cocoa brown double-breasted suit',
    category: 'double-breasted-suits',
    summary: 'A warm brown double-breasted suit with peak lapels.',
    description: `A warm cocoa brown double-breasted suit with peak lapels, flap pockets and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces shown: Jacket and trousers\nJacket: Double-breasted, peak lapel',
    colour: { name: 'Cocoa brown', hex: '#8a5a40', family: 'brown' },
    images: [{ file: 'cocoa-double-breasted-suit.jpg', alt: 'Cocoa brown double-breasted suit with a white shirt', width: 960, height: 1280 }],
    occasions: ['special-occasions', 'weddings', 'corporate-business'],
    featured: true,
  },
  {
    slug: 'blush-double-breasted-suit',
    sku: 'ME-S-007',
    name: 'Blush pink double-breasted suit',
    category: 'double-breasted-suits',
    summary: 'A blush pink double-breasted suit with contrast buttons.',
    description: `A blush pink double-breasted suit with peak lapels, contrast buttons and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces shown: Jacket and trousers\nJacket: Double-breasted, peak lapel\nButtons: Contrast',
    colour: { name: 'Blush pink', hex: '#e6b3ae', family: 'pink' },
    images: [{ file: 'blush-double-breasted-suit.jpg', alt: 'Blush pink double-breasted suit with a white shirt and burgundy pocket square', width: 870, height: 1280 }],
    occasions: ['matric-dance', 'weddings', 'special-occasions'],
    featured: true,
  },
  {
    slug: 'navy-single-breasted-suit',
    sku: 'ME-S-008',
    name: 'Navy single-breasted suit',
    category: 'single-breasted-suits',
    summary: 'A navy single-breasted suit.',
    description: `A navy suit with a single-breasted, notch-lapel jacket and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Jacket: Single-breasted, notch lapel',
    colour: { name: 'Navy', hex: '#27375f', family: 'blue' },
    images: [{ file: 'navy-single-breasted-suit.jpg', alt: 'Navy single-breasted suit with a white shirt', width: 852, height: 1280 }],
    occasions: ['corporate-business', 'business-travel', 'graduation'],
    featured: true,
  },
  {
    slug: 'black-three-piece-suit',
    sku: 'ME-S-009',
    name: 'Black three-piece suit',
    category: 'three-piece-suits',
    summary: 'A black three-piece with a classic buttoned waistcoat.',
    description: `A black three-piece suit: single-breasted jacket, classic buttoned waistcoat and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces: Jacket, waistcoat and trousers\nJacket: Single-breasted, notch lapel\nWaistcoat: Classic V front',
    colour: { name: 'Black', hex: '#1c1c1c', family: 'black' },
    images: [{ file: 'black-three-piece-suit.jpg', alt: 'Black three-piece suit worn with a black shirt and olive tie', width: 864, height: 1280 }],
    occasions: ['corporate-business', 'formal-black-tie', 'business-travel'],
  },
  {
    slug: 'terracotta-double-breasted-suit',
    sku: 'ME-S-010',
    name: 'Terracotta double-breasted suit',
    category: 'double-breasted-suits',
    summary: 'A terracotta double-breasted suit with peak lapels.',
    description: `A terracotta double-breasted suit with peak lapels, flap pockets and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces shown: Jacket and trousers\nJacket: Double-breasted, peak lapel',
    colour: { name: 'Terracotta', hex: '#b5553a', family: 'red' },
    images: [{ file: 'terracotta-double-breasted-suit.jpg', alt: 'Terracotta double-breasted suit with a white shirt', width: 776, height: 1280 }],
    occasions: ['special-occasions', 'matric-dance', 'weddings'],
  },
  {
    slug: 'citron-double-breasted-suit',
    sku: 'ME-S-011',
    name: 'Citron yellow double-breasted suit',
    category: 'double-breasted-suits',
    summary: 'A citron yellow double-breasted suit with contrast buttons.',
    description: `A citron yellow double-breasted suit with peak lapels, contrast buttons and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Pieces shown: Jacket and trousers\nJacket: Double-breasted, peak lapel\nButtons: Contrast',
    colour: { name: 'Citron yellow', hex: '#d9cf5c', family: 'yellow' },
    images: [{ file: 'citron-double-breasted-suit.jpg', alt: 'Citron yellow double-breasted suit with a navy shirt', width: 862, height: 1280 }],
    occasions: ['matric-dance', 'special-occasions'],
  },
  {
    slug: 'ivory-windowpane-suit',
    sku: 'ME-S-012',
    name: 'Ivory windowpane suit',
    category: 'single-breasted-suits',
    summary: 'An ivory suit with a fine windowpane check.',
    description: `An ivory suit with a fine windowpane check and a single-breasted, notch-lapel jacket. ${STYLED} ${ASK}`,
    specs: 'Jacket: Single-breasted, notch lapel\nPattern: Windowpane check',
    colour: { name: 'Ivory windowpane', hex: '#ece9e2', family: 'ivory' },
    images: [{ file: 'ivory-windowpane-suit.jpg', alt: 'Ivory windowpane check suit with a charcoal shirt and brown tie', width: 960, height: 1280 }],
    occasions: ['weddings', 'special-occasions', 'graduation'],
  },
  {
    slug: 'sage-single-breasted-suit',
    sku: 'ME-S-013',
    name: 'Sage single-breasted suit',
    category: 'single-breasted-suits',
    summary: 'A soft sage green single-breasted suit.',
    description: `A soft sage green suit with a single-breasted, notch-lapel jacket and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Jacket: Single-breasted, notch lapel',
    colour: { name: 'Sage', hex: '#b7bba0', family: 'green' },
    images: [{ file: 'sage-single-breasted-suit.jpg', alt: 'Sage green single-breasted suit with a pale blue shirt', width: 866, height: 1280 }],
    occasions: ['weddings', 'graduation', 'special-occasions'],
  },
  {
    slug: 'lilac-single-breasted-suit',
    sku: 'ME-S-014',
    name: 'Dusty lilac single-breasted suit',
    category: 'single-breasted-suits',
    summary: 'A pale dusty lilac single-breasted suit.',
    description: `A pale dusty lilac suit with a single-breasted, notch-lapel jacket and matching trousers. ${STYLED} ${ASK}`,
    specs: 'Jacket: Single-breasted, notch lapel',
    colour: { name: 'Dusty lilac', hex: '#d9c3cc', family: 'pink' },
    images: [{ file: 'lilac-single-breasted-suit.jpg', alt: 'Dusty lilac single-breasted suit with a navy shirt', width: 920, height: 1280 }],
    occasions: ['matric-dance', 'weddings', 'special-occasions'],
  },
]

async function main() {
  for (const c of categories) {
    await db.category.upsert({ where: { slug: c.slug }, create: c, update: {} })
  }
  for (const o of occasions) {
    await db.occasion.upsert({ where: { slug: o.slug }, create: o, update: {} })
  }

  let created = 0
  for (const [index, p] of products.entries()) {
    if (await db.product.findUnique({ where: { slug: p.slug } })) continue
    const category = await db.category.findUnique({ where: { slug: p.category } })
    const product = await db.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        summary: p.summary,
        description: p.description,
        specs: p.specs,
        categoryId: category?.id,
        priceCents: null, // price on request until the owner sets it
        isFeatured: Boolean(p.featured),
        sortOrder: index + 1,
        occasions: { connect: p.occasions.map((slug) => ({ slug })) },
        colours: { create: { name: p.colour.name, hex: p.colour.hex, family: p.colour.family, sortOrder: 0 } },
      },
      include: { colours: true },
    })
    await db.productImage.createMany({
      data: p.images.map((img, i) => ({
        productId: product.id,
        colourId: product.colours[0].id,
        url: `/products/${img.file}`,
        alt: img.alt,
        width: img.width,
        height: img.height,
        sortOrder: i,
      })),
    })
    created++
  }

  if ((await db.deliveryMethod.count()) === 0) {
    await db.deliveryMethod.createMany({
      data: [
        {
          name: 'Collect from our Johannesburg store',
          type: 'COLLECTION',
          feeCents: 0,
          description: 'We will email you when your order is ready to collect.',
          isActive: true,
          sortOrder: 1,
        },
        {
          // Left switched off: the delivery fee and timing must be confirmed by the owner first.
          name: 'Courier delivery',
          type: 'DELIVERY',
          feeCents: 0,
          description: '',
          isActive: false,
          sortOrder: 2,
        },
      ],
    })
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    const existing = await db.user.findUnique({ where: { email } })
    if (!existing) {
      await db.user.create({
        data: { email, passwordHash: await hashPassword(password), firstName: 'Store', lastName: 'Admin', role: 'ADMIN' },
      })
      console.log(`Admin account created for ${email}`)
    } else if (existing.role !== 'ADMIN') {
      await db.user.update({ where: { email }, data: { role: 'ADMIN' } })
      console.log(`${email} is now an admin`)
    }
  }

  console.log(`Seed complete. ${created} product(s) added, ${products.length - created} already present.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => process.exit(0))
