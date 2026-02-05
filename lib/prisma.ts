import { PrismaClient } from './generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // Try different environment variable names that Vercel might use
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_PRISMA_URL

  if (!connectionString) {
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')))
    throw new Error('DATABASE_URL environment variable is not set')
  }

  console.log('Creating Prisma client with connection string:', connectionString.substring(0, 30) + '...')

  const pool = new Pool({ connectionString })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaNeon(pool as any)
  return new PrismaClient({ adapter })
}

// Lazy initialization - create client only when first accessed
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    return client[prop as keyof PrismaClient]
  },
})
