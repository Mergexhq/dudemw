import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Prevent multiple Prisma Client instances in dev (hot-reload creates new instances)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Prevent Neon serverless cold-start from hanging past Hostinger's 30s Nginx timeout
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 20000,
    max: 10,
    // Required for Neon (PostgreSQL) in production — enables SSL without strict cert validation
    // sslmode=verify-full in the connection string requires SSL to be configured on the pool side
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
})

// Log pool errors so they don't silently crash the process
pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle client:', err.message)
})

const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma
