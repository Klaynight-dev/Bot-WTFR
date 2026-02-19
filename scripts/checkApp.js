require('dotenv').config()
const { REST, Routes } = require('discord.js')

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

;(async () => {
  try {
    const app = await rest.get(Routes.oauth2CurrentApplication())
    console.log(JSON.stringify(app, null, 2))
  } catch (err) {
    console.error('ERROR:', err)
    process.exit(1)
  }
})()
