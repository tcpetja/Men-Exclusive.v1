'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createSession, destroySession, hashPassword, newToken, requireUser, safeNext, sha256, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendPasswordReset } from '@/lib/email'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { siteUrl } from '@/lib/settings'
import { addressSchema, emailField, fieldErrors, loginSchema, passwordField, profileSchema, registerSchema, type ActionState } from '@/lib/validation'

function values(form: FormData, omit: string[] = ['password', 'newPassword', 'currentPassword']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string' && !omit.includes(k)) out[k] = v
  return out
}

// A real hash to compare against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = 'scrypt$c2FsdHNhbHRzYWx0c2FsdA==$' + Buffer.alloc(64, 1).toString('base64')

export async function registerAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const v = values(form)
  if (!(await rateLimit(`register:${await clientIp()}`, 8, 3600))) return { message: 'Too many attempts. Please try again later.', values: v }

  const parsed = registerSchema.safeParse({ ...v, password: form.get('password'), marketingOptIn: form.get('marketingOptIn') === 'on' })
  if (!parsed.success) return { message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error), values: v }
  const d = parsed.data

  if (await db.user.findUnique({ where: { email: d.email } })) {
    return { message: 'An account with this email address already exists. Sign in instead, or reset your password.', fields: { email: 'This email address is already registered.' }, values: v }
  }

  const user = await db.user.create({
    data: { email: d.email, passwordHash: await hashPassword(d.password), firstName: d.firstName, lastName: d.lastName, phone: d.phone || null, marketingOptIn: d.marketingOptIn },
  })
  if (d.marketingOptIn) await db.subscriber.upsert({ where: { email: d.email }, create: { email: d.email, source: 'account' }, update: {} })

  // Registering straight after a guest purchase links that order to the new account — but only when the
  // visitor holds the order's private link AND registers with the email the order was placed with.
  const orderToken = typeof v.order === 'string' ? v.order : ''
  if (orderToken) {
    await db.order.updateMany({ where: { publicToken: orderToken, userId: null, email: d.email }, data: { userId: user.id } })
  }

  await createSession(user.id)
  redirect(safeNext(v.next, '/account'))
}

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const v = values(form)
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') })
  if (!parsed.success) return { message: 'Enter your email address and password.', fields: fieldErrors(parsed.error), values: v }
  const { email, password } = parsed.data

  const ip = await clientIp()
  const allowed = (await rateLimit(`login:ip:${ip}`, 30, 900)) && (await rateLimit(`login:email:${email}`, 8, 900))
  if (!allowed) return { message: 'Too many sign-in attempts. Please wait 15 minutes and try again, or reset your password.', values: v }

  const user = await db.user.findUnique({ where: { email } })
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !ok) return { message: 'The email address or password is incorrect.', values: v }

  await createSession(user.id)
  redirect(safeNext(v.next, user.role === 'ADMIN' ? '/admin' : '/account'))
}

export async function logoutAction() {
  await destroySession()
  redirect('/')
}

export async function forgotPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const done: ActionState = { ok: true, message: 'If an account exists for that email address, we have sent a link to reset the password. It is valid for 60 minutes.' }
  const parsed = emailField.safeParse(form.get('email'))
  if (!parsed.success) return { message: 'Enter a valid email address.', values: values(form) }
  if (!(await rateLimit(`forgot:${await clientIp()}`, 5, 3600)) || !(await rateLimit(`forgot:email:${parsed.data}`, 3, 3600))) return done

  const user = await db.user.findUnique({ where: { email: parsed.data } })
  if (user) {
    const token = newToken()
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await db.passwordResetToken.create({ data: { tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + 60 * 60_000) } })
    await sendPasswordReset(user.email, user.firstName, `${siteUrl()}/account/reset?token=${token}`)
  }
  return done
}

export async function resetPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const token = String(form.get('token') ?? '')
  const parsed = passwordField.safeParse(form.get('password'))
  if (!parsed.success) return { message: 'Please choose a stronger password.', fields: fieldErrors(parsed.error) }
  if (form.get('password') !== form.get('confirm')) return { message: 'The two passwords do not match.', fields: { confirm: 'Type the same password again.' } }
  if (!(await rateLimit(`reset:${await clientIp()}`, 10, 3600))) return { message: 'Too many attempts. Please try again later.' }

  const record = token ? await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(token) } }) : null
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { message: 'This reset link has expired or has already been used. Request a new one.' }
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await hashPassword(parsed.data) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Signing out everywhere means a stolen session cannot survive a password reset.
    db.session.deleteMany({ where: { userId: record.userId } }),
  ])
  await createSession(record.userId)
  redirect('/account?reset=1')
}

export async function updateProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser('/account/details')
  const v = values(form)
  const parsed = profileSchema.safeParse({ ...v, marketingOptIn: form.get('marketingOptIn') === 'on' })
  if (!parsed.success) return { message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error), values: v }
  const d = parsed.data
  await db.user.update({ where: { id: user.id }, data: { firstName: d.firstName, lastName: d.lastName, phone: d.phone || null, marketingOptIn: d.marketingOptIn } })
  if (d.marketingOptIn) await db.subscriber.upsert({ where: { email: user.email }, create: { email: user.email, source: 'account' }, update: {} })
  else await db.subscriber.deleteMany({ where: { email: user.email } })
  revalidatePath('/account', 'layout')
  return { ok: true, message: 'Your details have been saved.' }
}

export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser('/account/details')
  if (!(await rateLimit(`pwchange:${user.id}`, 8, 900))) return { message: 'Too many attempts. Please try again later.' }
  const parsed = z.object({ currentPassword: z.string().min(1, 'Enter your current password.'), newPassword: passwordField }).safeParse({
    currentPassword: form.get('currentPassword'),
    newPassword: form.get('newPassword'),
  })
  if (!parsed.success) return { message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error) }
  const full = await db.user.findUnique({ where: { id: user.id } })
  if (!full || !(await verifyPassword(parsed.data.currentPassword, full.passwordHash))) {
    return { message: 'Your current password is incorrect.', fields: { currentPassword: 'This does not match your current password.' } }
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.newPassword) } })
  await db.session.deleteMany({ where: { userId: user.id } })
  await createSession(user.id)
  return { ok: true, message: 'Your password has been changed. Other devices have been signed out.' }
}

export async function saveAddressAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser('/account/addresses')
  const v = values(form)
  const parsed = addressSchema.safeParse(v)
  if (!parsed.success) return { message: 'Please check the highlighted fields.', fields: fieldErrors(parsed.error), values: v }
  const count = await db.address.count({ where: { userId: user.id } })
  if (count >= 10) return { message: 'You can save up to 10 addresses. Remove one to add another.', values: v }
  await db.address.create({ data: { ...parsed.data, line2: parsed.data.line2 || null, userId: user.id, isDefault: count === 0 } })
  revalidatePath('/account/addresses')
  return { ok: true, message: 'Address saved.' }
}

export async function deleteAddressAction(form: FormData) {
  const user = await requireUser('/account/addresses')
  const id = String(form.get('id') ?? '')
  await db.address.deleteMany({ where: { id, userId: user.id } })
  const remaining = await db.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } })
  if (remaining && !(await db.address.findFirst({ where: { userId: user.id, isDefault: true } }))) {
    await db.address.update({ where: { id: remaining.id }, data: { isDefault: true } })
  }
  revalidatePath('/account/addresses')
}

export async function setDefaultAddressAction(form: FormData) {
  const user = await requireUser('/account/addresses')
  const id = String(form.get('id') ?? '')
  const address = await db.address.findFirst({ where: { id, userId: user.id } })
  if (!address) return
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ])
  revalidatePath('/account/addresses')
}
