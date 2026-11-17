import assert from 'node:assert/strict'
import { test } from 'node:test'
import { centsToRandsInput, formatZAR, parseRandsToCents } from '../src/lib/money'
import { hashPassword, verifyPassword } from '../src/lib/password'
import { slugify } from '../src/lib/validation'
import { telLink, waDigits, waLink, waMessages } from '../src/lib/whatsapp'
import { signWebhook, verifyWebhookSignature, yocoConfig } from '../src/lib/yoco'

const SECRET = 'whsec_' + Buffer.from('a-test-signing-secret-32-bytes!!').toString('base64')
const BODY = JSON.stringify({ id: 'evt_1', type: 'payment.succeeded', payload: { id: 'p_1', amount: 449900, currency: 'ZAR', mode: 'test' } })

function signed(overrides: Partial<{ id: string; timestamp: string; body: string; secret: string }> = {}) {
  const id = overrides.id ?? 'msg_123'
  const timestamp = overrides.timestamp ?? String(Math.floor(Date.now() / 1000))
  return { id, timestamp, signature: signWebhook(id, timestamp, overrides.body ?? BODY, overrides.secret ?? SECRET) }
}

test('webhook: accepts a correctly signed delivery', () => {
  const s = signed()
  assert.deepEqual(verifyWebhookSignature({ ...s, rawBody: BODY, secret: SECRET }), { ok: true })
})

test('webhook: accepts when the valid signature is one of several in the header', () => {
  const s = signed()
  const header = `v1,${Buffer.from('not-the-signature').toString('base64')} ${s.signature} v2,abc`
  assert.equal(verifyWebhookSignature({ ...s, signature: header, rawBody: BODY, secret: SECRET }).ok, true)
})

test('webhook: rejects a body that was changed after signing', () => {
  const s = signed()
  const tampered = BODY.replace('449900', '100')
  assert.equal(verifyWebhookSignature({ ...s, rawBody: tampered, secret: SECRET }).ok, false)
})

test('webhook: rejects a signature made with a different secret', () => {
  const s = signed({ secret: 'whsec_' + Buffer.from('some-other-secret').toString('base64') })
  assert.equal(verifyWebhookSignature({ ...s, rawBody: BODY, secret: SECRET }).ok, false)
})

test('webhook: rejects deliveries older than the tolerance (replay protection)', () => {
  const old = String(Math.floor(Date.now() / 1000) - 600)
  const s = signed({ timestamp: old })
  const result = verifyWebhookSignature({ ...s, rawBody: BODY, secret: SECRET })
  assert.equal(result.ok, false)
})

test('webhook: rejects a timestamp swapped onto an old signature', () => {
  const s = signed({ timestamp: String(Math.floor(Date.now() / 1000) - 600) })
  const result = verifyWebhookSignature({ ...s, timestamp: String(Math.floor(Date.now() / 1000)), rawBody: BODY, secret: SECRET })
  assert.equal(result.ok, false)
})

test('webhook: rejects missing headers and malformed signatures without throwing', () => {
  assert.equal(verifyWebhookSignature({ id: null, timestamp: null, signature: null, rawBody: BODY, secret: SECRET }).ok, false)
  const s = signed()
  for (const bad of ['', 'v1', 'v1,', 'garbage', 'v1,!!!not-base64!!!', 'v2,' + s.signature.slice(3)]) {
    assert.equal(verifyWebhookSignature({ ...s, signature: bad, rawBody: BODY, secret: SECRET }).ok, false, `signature "${bad}" must be rejected`)
  }
})

test('yoco config: test and live keys are kept apart', () => {
  const live = yocoConfig({ YOCO_MODE: 'live', YOCO_LIVE_SECRET_KEY: 'sk_live_abc', YOCO_LIVE_WEBHOOK_SECRET: 'whsec_abc', YOCO_TEST_SECRET_KEY: 'sk_test_zzz' })
  assert.equal(live.mode, 'live')
  assert.equal(live.secretKey, 'sk_live_abc')
  assert.deepEqual(live.problems, [])

  const wrongKey = yocoConfig({ YOCO_MODE: 'live', YOCO_LIVE_SECRET_KEY: 'sk_test_abc', YOCO_LIVE_WEBHOOK_SECRET: 'whsec_abc' })
  assert.equal(wrongKey.secretKey, null, 'a test key must never be used in live mode')

  const defaulted = yocoConfig({})
  assert.equal(defaulted.mode, 'test')
  assert.equal(defaulted.secretKey, null)
  assert.equal(defaulted.problems.length, 2)
})

test('yoco config: a custom API address is ignored in live mode', () => {
  const live = yocoConfig({ YOCO_MODE: 'live', YOCO_LIVE_SECRET_KEY: 'sk_live_abc', YOCO_LIVE_WEBHOOK_SECRET: 'whsec_abc', YOCO_API_BASE: 'http://localhost:4010' })
  assert.equal(live.apiBase, 'https://payments.yoco.com')
  const testMode = yocoConfig({ YOCO_MODE: 'test', YOCO_TEST_SECRET_KEY: 'sk_test_abc', YOCO_TEST_WEBHOOK_SECRET: 'whsec_abc', YOCO_API_BASE: 'http://localhost:4010/' })
  assert.equal(testMode.apiBase, 'http://localhost:4010')
})

test('money: formats Rand the South African way', () => {
  assert.equal(formatZAR(449900), 'R 4 499')
  assert.equal(formatZAR(449995), 'R 4 499.95')
  assert.equal(formatZAR(0), 'R 0')
  assert.equal(formatZAR(123456789), 'R 1 234 567.89')
})

test('money: parses what people type into cents', () => {
  assert.equal(parseRandsToCents('4499'), 449900)
  assert.equal(parseRandsToCents('R 4 499.50'), 449950)
  assert.equal(parseRandsToCents('4,499.5'), 449950)
  assert.equal(parseRandsToCents('4499,95'), 449995)
  assert.equal(parseRandsToCents(''), null)
  assert.equal(parseRandsToCents('abc'), null)
  assert.equal(parseRandsToCents('-5'), null)
  assert.equal(parseRandsToCents('12.345'), null)
  assert.equal(centsToRandsInput(449900), '4499')
  assert.equal(centsToRandsInput(449950), '4499.50')
  assert.equal(centsToRandsInput(null), '')
})

test('whatsapp: builds links with South African numbers and prefilled messages', () => {
  assert.equal(waDigits('063 051 2118'), '27630512118')
  assert.equal(waDigits('+27 63 051 2118'), '27630512118')
  assert.equal(telLink('063 051 2118'), 'tel:+27630512118')
  const link = waLink('+27 63 051 2118', waMessages.product('Ivory double-breasted suit', 'ME-S-002'))
  assert.ok(link.startsWith('https://wa.me/27630512118?text='))
  assert.ok(decodeURIComponent(link).includes('Ivory double-breasted suit, reference ME-S-002'))
  assert.ok(waMessages.order('ME-10001').includes('ME-10001'))
})

test('passwords: hash and verify, and never store plain text', async () => {
  const hash = await hashPassword('correct horse battery')
  assert.ok(hash.startsWith('scrypt$'))
  assert.ok(!hash.includes('correct horse'))
  assert.equal(await verifyPassword('correct horse battery', hash), true)
  assert.equal(await verifyPassword('wrong password here', hash), false)
  assert.equal(await verifyPassword('anything', 'not-a-hash'), false)
  assert.notEqual(hash, await hashPassword('correct horse battery'), 'each hash uses a fresh salt')
})

test('slugs: product names become clean web addresses', () => {
  assert.equal(slugify('Navy & Rust Windowpane Three-Piece Suit'), 'navy-and-rust-windowpane-three-piece-suit')
  assert.equal(slugify('  Crème   Suit!! '), 'creme-suit')
})
