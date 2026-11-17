import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Prisma command-line configuration (migrations and seeding).
 *
 * Migrations need a direct database connection. Hosted Postgres providers usually give two addresses:
 * a pooled one for the website (DATABASE_URL) and a direct one for migrations. If a direct address is
 * present it is used here: DIRECT_URL, or DATABASE_URL_UNPOOLED (the name Neon uses on Vercel).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
})
