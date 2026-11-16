import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Product photographs: files shipped with the site (/products), uploads from the admin (/media), brand assets.
    localPatterns: [{ pathname: '/products/**' }, { pathname: '/media/**' }, { pathname: '/brand/**' }],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  serverExternalPackages: ['sharp', 'pg', 'nodemailer'],
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // Never let a shared cache keep private pages.
      { source: '/(account|admin|checkout|order)(.*)', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
    ]
  },
}

export default config
