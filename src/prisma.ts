import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.BDD_URL
if (!connectionString || connectionString.trim().length === 0) {
  throw new Error('Environment variable BDD_URL is required to initialize Prisma (Prisma v7 adapter).')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export default prisma
