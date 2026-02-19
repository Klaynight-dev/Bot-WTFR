require('dotenv').config()
const { REST, Routes } = require('discord.js')

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
const channelId = process.env.CHANNEL_ID

;(async () => {
  try {
    if (!channelId) return console.error('CHANNEL_ID not set in .env')
    const ch = await rest.get(Routes.channel(channelId))
    console.log('Channel:', ch.id, ch.name)
    console.log('type:', ch.type)
    console.log('permission_overwrites:')
    for (const o of ch.permission_overwrites || []) {
      console.log(` - id=${o.id} type=${o.type} allow=${o.allow} deny=${o.deny}`)
    }
  } catch (err) {
    console.error('ERROR:', err)
    process.exitCode = 1
  }
})()
