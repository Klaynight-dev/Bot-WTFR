require('dotenv').config()
const { REST, Routes } = require('discord.js')
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)
const channelId = process.argv[2]

;(async () => {
  try {
    if (!channelId) return console.error('Usage: node showChannel.js <channelId>')
    const ch = await rest.get(Routes.channel(channelId))
    console.log(JSON.stringify(ch, null, 2))
  } catch (err) {
    console.error('ERROR:', err)
  }
})()
