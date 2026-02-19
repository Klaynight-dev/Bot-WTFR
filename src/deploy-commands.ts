import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

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
  const CLIENT_ID = process.env.CLIENT_ID as string
  const GUILD_ID = process.env.GUILD_ID as string | undefined
  const SCOPE = (process.env.DEPLOY_SCOPE || 'guild').toLowerCase()

  try {
    console.log(`⏳ Déploiement des commandes (scope=${SCOPE})...`)

    if (SCOPE === 'guild') {
      if (!GUILD_ID) throw new Error('GUILD_ID requis pour le déploiement en guilde')

      // Déployer uniquement en guilde
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
      // Nettoyer les commandes globales restantes (évite les commandes fantômes)
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })

      console.log('✅ Commandes déployées en guilde — commandes globales supprimées.')
    } else if (SCOPE === 'global') {
      // Déployer globalement
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
      // Supprimer les commandes de la guilde cible si elle existe
      if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })

      console.log('✅ Commandes déployées globalement — commandes de guilde supprimées.')
    } else {
      throw new Error(`DEPLOY_SCOPE invalide : ${SCOPE} (utiliser 'guild' ou 'global')`)
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
