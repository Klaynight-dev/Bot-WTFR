import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Initialize real Prisma client only when BDD_URL is provided.
// If missing, export a proxy that allows the app to start (useful for command deploys)
// while making DB calls fail with a clear message at the time of use.
const connectionString = process.env.BDD_URL?.trim()

if (connectionString) {
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })
  export default prisma
} else {
  const missingMsg = 'Environment variable BDD_URL is not set — Prisma is disabled.'
  // A proxy that returns async functions which reject with a helpful error when called.
  const handler: ProxyHandler<any> = {
    get: () => {
      return new Proxy(() => Promise.reject(new Error(missingMsg)), {
        apply: (target, thisArg, args) => {
          return Promise.reject(new Error(missingMsg))
        },
        get: () => handler.get
      })
    }
  }

  const noopPrisma = new Proxy({}, handler)
  // Provide no-op connect/disconnect so lifecycle calls won't fail.
  noopPrisma.$connect = async () => undefined
  noopPrisma.$disconnect = async () => undefined

  export default noopPrisma as unknown as PrismaClient
}
