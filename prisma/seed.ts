import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  // pseudos
  const pseudosPath = './pseudos.json'
  if (fs.existsSync(pseudosPath)) {
    const pseudos = JSON.parse(fs.readFileSync(pseudosPath, 'utf8') || '[]')
    for (const p of pseudos) {
      await prisma.pseudo.upsert({ where: { id: p.id }, update: { display: p.display, roblox: p.roblox }, create: { id: p.id, display: p.display, roblox: p.roblox } })
    }
    console.log(`Imported ${pseudos.length} pseudos`)
  }

  // warnings
  const warningsPath = './warnings.json'
  if (fs.existsSync(warningsPath)) {
    const warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8') || '[]')
    for (const w of warnings) {
      await prisma.warning.create({ data: { userId: w.id, moderatorId: w.moderator, reason: w.reason, date: new Date(w.date) } })
    }
    console.log(`Imported ${warnings.length} warnings`)
  }

  // messageId.json
  const msgPath = './messageId.json'
  if (fs.existsSync(msgPath)) {
    const msgData = JSON.parse(fs.readFileSync(msgPath, 'utf8') || '{}') || {}
    const existing = await prisma.messageState.findFirst()
    if (existing) {
      await prisma.messageState.update({ where: { id: existing.id }, data: { channelId: msgData.channelId ?? null, messageId: msgData.messageId ?? null, page: typeof msgData.page === 'number' ? msgData.page : null } })
    } else {
      await prisma.messageState.create({ data: { channelId: msgData.channelId ?? null, messageId: msgData.messageId ?? null, page: typeof msgData.page === 'number' ? msgData.page : null } })
    }
    console.log('Imported messageId.json')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
