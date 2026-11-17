/**
 * Creates a store admin account, or turns an existing customer account into an admin.
 *
 *   npm run admin:create -- owner@example.com "a long password"
 *
 * If the account already exists its password is left alone unless you add --reset-password.
 */
import 'dotenv/config'
import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/password'

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const reset = process.argv.includes('--reset-password')
  const email = args[0]?.trim().toLowerCase()
  const password = args[1]
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    console.error('Usage: npm run admin:create -- owner@example.com "a long password"')
    process.exit(1)
  }
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    const data: { role: 'ADMIN'; passwordHash?: string } = { role: 'ADMIN' }
    if (reset) {
      if (!password || password.length < 10) throw new Error('Give a new password of at least 10 characters.')
      data.passwordHash = await hashPassword(password)
      await db.session.deleteMany({ where: { userId: existing.id } })
    }
    await db.user.update({ where: { email }, data })
    console.log(`${email} is an admin.${reset ? ' Password reset and all devices signed out.' : ''}`)
    return
  }
  if (!password || password.length < 10) throw new Error('Give a password of at least 10 characters.')
  await db.user.create({ data: { email, passwordHash: await hashPassword(password), firstName: 'Store', lastName: 'Admin', role: 'ADMIN' } })
  console.log(`Admin account created for ${email}. Sign in at /account/login`)
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(() => process.exit())
