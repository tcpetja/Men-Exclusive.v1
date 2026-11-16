/**
 * Manage the Yoco webhook that tells the website when a payment has succeeded.
 *
 *   npm run yoco:webhook list
 *   npm run yoco:webhook register https://www.your-domain.co.za/api/webhooks/yoco
 *   npm run yoco:webhook delete sub_xxxxxxxx
 *
 * Uses the key for the current YOCO_MODE (test or live) from your environment. Run it once per mode.
 * "register" prints a secret that starts with whsec_. Yoco shows it only once: copy it into
 * YOCO_TEST_WEBHOOK_SECRET or YOCO_LIVE_WEBHOOK_SECRET straight away.
 */
import 'dotenv/config'
import { yocoConfig, yocoWebhooks } from '../src/lib/yoco'

async function main() {
  const [command, arg] = process.argv.slice(2)
  const config = yocoConfig()
  if (!config.secretKey) {
    console.error(`Yoco ${config.mode} secret key is missing or invalid.\n${config.problems.join('\n')}`)
    process.exit(1)
  }
  console.log(`Yoco mode: ${config.mode}`)

  if (command === 'list') {
    const { subscriptions } = await yocoWebhooks.list()
    if (!subscriptions?.length) return console.log('No webhooks are registered.')
    for (const s of subscriptions) console.log(`${s.id}  ${s.mode}  ${s.url}  (${s.name})`)
    return
  }

  if (command === 'register') {
    if (!arg || !/^https:\/\/.+\/api\/webhooks\/yoco$/.test(arg)) {
      console.error('Give the full HTTPS address of the webhook, for example:\n  npm run yoco:webhook register https://www.your-domain.co.za/api/webhooks/yoco')
      process.exit(1)
    }
    const existing = (await yocoWebhooks.list()).subscriptions?.find((s) => s.url === arg)
    if (existing) {
      console.error(`A webhook for that address already exists (${existing.id}). Yoco cannot show its secret again.\nIf you have lost the secret, delete it and register again:\n  npm run yoco:webhook delete ${existing.id}`)
      process.exit(1)
    }
    const created = await yocoWebhooks.register('MEN EXCLUSIVE website', arg)
    const variable = config.mode === 'live' ? 'YOCO_LIVE_WEBHOOK_SECRET' : 'YOCO_TEST_WEBHOOK_SECRET'
    console.log(`\nWebhook registered: ${created.id} (${created.mode})\n\nAdd this to your hosting environment now. Yoco will not show it again:\n\n  ${variable}=${created.secret}\n`)
    return
  }

  if (command === 'delete' && arg) {
    const result = await yocoWebhooks.remove(arg)
    return console.log(result.message ?? 'Deleted.')
  }

  console.log('Usage:\n  npm run yoco:webhook list\n  npm run yoco:webhook register https://your-domain/api/webhooks/yoco\n  npm run yoco:webhook delete <id>')
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
