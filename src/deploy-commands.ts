import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { REST, Routes } from 'discord.js'

const commands: any[] = []
const commandsPath = path.join(__dirname, 'commands')
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))
  for (const file of commandFiles) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command = require(path.join(commandsPath, file))
    commands.push(command.data.toJSON())
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN as string)

;(async () => {
  try {
    console.log('⏳ Déploiement des commandes...')
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.GUILD_ID as string),
      { body: commands }
    )
    console.log('✅ Commandes déployées !')
  } catch (error) {
    console.error(error)
  }
})()
