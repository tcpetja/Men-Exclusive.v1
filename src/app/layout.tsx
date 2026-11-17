import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { SEO_DEFAULT_DESCRIPTION } from '@/lib/seo'
import { siteUrl } from '@/lib/settings'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "MEN EXCLUSIVE | Men's suits in Johannesburg, South Africa",
    template: '%s | MEN EXCLUSIVE',
  },
  description: SEO_DEFAULT_DESCRIPTION,
  applicationName: 'MEN EXCLUSIVE',
  openGraph: {
    type: 'website',
    siteName: 'MEN EXCLUSIVE',
    locale: 'en_ZA',
    images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630, alt: 'MEN EXCLUSIVE, Dress to impress' }],
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-ZA" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  )
}
