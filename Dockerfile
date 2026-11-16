# MEN EXCLUSIVE — container image for self-hosting (any VPS or container host).
# The database is not included: point DATABASE_URL at a PostgreSQL server (see docker-compose.yml).
FROM node:22-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx next build

ENV NODE_ENV=production
EXPOSE 3000
# On every start: apply database migrations, add any missing seed records, then serve the site.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npx next start -p 3000"]
