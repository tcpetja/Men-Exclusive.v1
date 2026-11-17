/** The public address of the website, without a trailing slash. Used for links in emails and payment redirects. */
export function siteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}
