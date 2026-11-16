import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalForDb = globalThis as unknown as { __db?: PrismaClient }

function createClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

/** Lazily created so that importing this module never requires a database (e.g. during builds). */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = (globalForDb.__db ??= createClient())
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
