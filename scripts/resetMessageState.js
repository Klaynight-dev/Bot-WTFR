require('dotenv').config()
const prisma = require('../dist/prisma').default

;(async () => {
  try {
    const row = await prisma.messageState.findFirst()
    if (!row) {
      console.log('No messageState row found')
      return
    }

    await prisma.messageState.update({ where: { id: row.id }, data: { messageId: null } })
    console.log(`Updated messageState id=${row.id}: messageId set to null`)
  } catch (err) {
    console.error('ERROR:', err)
    process.exit(1)
  } finally {
    if (typeof prisma.$disconnect === 'function') await prisma.$disconnect()
  }
})()
