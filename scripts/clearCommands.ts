
import 'dotenv/config'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN as string)
const CLIENT_ID = process.env.CLIENT_ID as string
const GUILD_ID = process.env.GUILD_ID as string

    ; (async () => {
        try {
            console.log('🧹 Nettoyage des commandes...')

            // Clear Global
            console.log('... Suppression des commandes globales')
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] })

            // Clear Guild (if GUILD_ID exists)
            if (GUILD_ID) {
                console.log(`... Suppression des commandes de la guilde ${GUILD_ID}`)
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
            }

            console.log('✅ Toutes les commandes ont été supprimées (cache vidé).')
            console.log('👉 Lance maintenant "npm run deploy:guild" ou "npm run deploy:global" pour remettre les commandes.')

        } catch (error) {
            console.error('Erreur lors du nettoyage :', error)
        }
    })()
