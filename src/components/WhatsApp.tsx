import type { ReactNode } from 'react'
import { getSettings } from '@/lib/settings'
import { waLink, waMessages } from '@/lib/whatsapp'
import { IconWhatsApp } from './icons'

/** A WhatsApp link with a prefilled message. Opens the customer's WhatsApp app with the store's number. */
export async function WhatsAppButton({
  message,
  children,
  className = 'btn btn-line',
  icon = true,
}: {
  message: string
  children: ReactNode
  className?: string
  icon?: boolean
}) {
  const { whatsapp } = await getSettings()
  if (!whatsapp) return null
  return (
    <a href={waLink(whatsapp, message)} className={className} target="_blank" rel="noopener noreferrer">
      {icon && <IconWhatsApp />}
      {children}
    </a>
  )
}

export async function WhatsAppFloat() {
  const { whatsapp } = await getSettings()
  if (!whatsapp) return null
  return (
    <a href={waLink(whatsapp, waMessages.general())} className="wa-float" target="_blank" rel="noopener noreferrer" aria-label="Chat to us on WhatsApp">
      <IconWhatsApp />
      <span>WhatsApp us</span>
    </a>
  )
}
