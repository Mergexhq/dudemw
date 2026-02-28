import { PrismaClient } from '../generated/prisma'

// Prevent multiple Prisma Client instances in dev (hot-reload creates new instances)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}

export default prisma
