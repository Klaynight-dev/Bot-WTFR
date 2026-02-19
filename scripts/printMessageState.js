require('dotenv').config()
// Use the project's compiled Prisma wrapper (dist/prisma.js) so adapter/config is applied
const prisma = require('../dist/prisma').default

;(async () => {
  try {
    const rows = await prisma.messageState.findMany()
    console.log(JSON.stringify(rows, null, 2))
  } catch (err) {
    console.error('ERROR:', err)
    process.exit(1)
  } finally {
    if (typeof prisma.$disconnect === 'function') await prisma.$disconnect()
  }
})()
