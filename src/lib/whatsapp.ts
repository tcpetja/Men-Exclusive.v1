/** Normalises a South African number to the digits-only international form wa.me expects (27XXXXXXXXX). */
export function waDigits(number: string): string {
  let d = (number || '').replace(/\D/g, '')
  if (d.startsWith('0') && d.length === 10) d = '27' + d.slice(1)
  return d
}

export function waLink(number: string, message: string): string {
  return `https://wa.me/${waDigits(number)}?text=${encodeURIComponent(message)}`
}

export function telLink(number: string): string {
  const d = waDigits(number)
  return d ? `tel:+${d}` : '#'
}

/** Prefilled WhatsApp messages. Kept in one place so the wording stays consistent across the site. */
export const waMessages = {
  general: () => 'Good day. I would like some assistance from MEN EXCLUSIVE.',
  product: (name: string, sku: string) =>
    `Good day. I am interested in the ${name}, reference ${sku}. Please assist me with available sizes, colours and fitting options.`,
  size: (name: string, sku: string) =>
    `Good day. I need help choosing the right size for the ${name}, reference ${sku}.`,
  colour: (name: string, sku: string) =>
    `Good day. Please let me know which colours are available for the ${name}, reference ${sku}.`,
  price: (name: string, sku: string) =>
    `Good day. Please send me the price and available sizes for the ${name}, reference ${sku}.`,
  recommend: (occasion?: string) =>
    occasion
      ? `Good day. I am looking for a suit for ${occasion}. Please recommend suitable options.`
      : 'Good day. I would like a recommendation on a suit. Please assist.',
  fitting: () => 'Good day. I would like to request a fitting at MEN EXCLUSIVE. Please let me know which times are available.',
  alteration: () =>
    'Good day. I would like to request an alteration assessment. Please let me know what you need from me and when I can come in.',
  wedding: () =>
    'Good day. I am enquiring about suits for a wedding party. Please assist me with options for the groom and groomsmen.',
  corporate: () =>
    'Good day. I am enquiring about corporate wardrobe options for my team. Please assist.',
  order: (orderNumber: string) => `Good day. I need assistance with my order ${orderNumber}.`,
  special: () => 'Good day. I have a special request and would like to speak to someone at MEN EXCLUSIVE.',
  appointment: (a: {
    name: string
    purpose: string
    occasion?: string
    date: string
    time: string
    notes?: string
  }) =>
    [
      'Good day. I would like to request an appointment at MEN EXCLUSIVE.',
      `Name: ${a.name}`,
      `Purpose: ${a.purpose}`,
      a.occasion ? `Occasion: ${a.occasion}` : null,
      `Preferred date: ${a.date}`,
      `Preferred time: ${a.time}`,
      a.notes ? `Notes: ${a.notes}` : null,
      'I understand the appointment is only confirmed once you reply.',
    ]
      .filter(Boolean)
      .join('\n'),
}
