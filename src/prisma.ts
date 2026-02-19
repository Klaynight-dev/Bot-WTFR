import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Initialize real Prisma client only when BDD_URL is provided.
// If missing, export a proxy that allows the app to start (useful for command deploys)
// while making DB calls fail with a clear message at the time of use.
const connectionString = process.env.BDD_URL?.trim()

let prisma: any

if (connectionString) {
  const adapter = new PrismaPg({ connectionString })
  prisma = new PrismaClient({ adapter })
} else {
  const missingMsg = 'Environment variable BDD_URL is not set — Prisma is disabled.'
  // A proxy that returns async functions which reject with a helpful error when called.
  const handler: ProxyHandler<any> = {
    get: (target, prop) => {
      if (prop in target) return (target as any)[prop]
      return new Proxy(() => Promise.reject(new Error(missingMsg)), {
        apply: () => Promise.reject(new Error(missingMsg)),
        get: () => handler.get,
      })
    }
  }

  const noopPrisma = new Proxy({}, handler)
  // Provide no-op connect/disconnect so lifecycle calls won't fail.
  noopPrisma.$connect = async () => undefined
  noopPrisma.$disconnect = async () => undefined

  prisma = noopPrisma
}

export const prismaEnabled = Boolean(connectionString)

export default prisma as PrismaClient
