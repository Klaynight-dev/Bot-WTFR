require('dotenv').config()
const { REST, Routes } = require('discord.js')
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

;(async () => {
  try {
    const guilds = await rest.get(Routes.userGuilds())
    console.log('Guilds visible to the bot:')
    console.log(JSON.stringify(guilds, null, 2))
  } catch (err) {
    console.error('ERROR:', err)
    process.exitCode = 1
  }
})()
