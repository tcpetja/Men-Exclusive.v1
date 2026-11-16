import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'
import { SESSION_COOKIE } from './constants'
import { hashPassword, newToken, sha256, verifyPassword } from './password'

export { hashPassword, newToken, sha256, verifyPassword }

const SESSION_DAYS = 30

export async function createSession(userId: string) {
  const token = newToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await db.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } })
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: sha256(token) } })
    jar.delete(SESSION_COOKIE)
  }
}

export type CurrentUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'CUSTOMER' | 'ADMIN'
  marketingOptIn: boolean
}

/** The signed-in user for this request, or null. Never throws for anonymous visitors. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, marketingOptIn: true },
      },
    },
  })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
})

export async function requireUser(returnTo = '/account'): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/account/login?next=${encodeURIComponent(returnTo)}`)
  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/account/login?next=/admin')
  if (user.role !== 'ADMIN') redirect('/account')
  return user
}

/** Only allow redirects back into this site. */
export function safeNext(next: string | null | undefined, fallback = '/account'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  return next
}
