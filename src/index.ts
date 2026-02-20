import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import prisma, { prismaEnabled } from './prisma'
import {
  Client,
  GatewayIntentBits,
  Collection
} from 'discord.js'

import { updateGlobalMessage } from './functions/updateMessage'

type ExtendedClient = Client & { commands: Collection<string, any> }
const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as ExtendedClient

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file))
    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command)
    } else {
      console.warn(`[warning] The command at ${file} is missing a required "data" or "data.name" property.`)
    }
  }
}

const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`[event] Loaded ${event.name} from ${file}`)
  }
}

import { startDashboard } from './dashboard/app'

client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user?.tag}`)

  // Start Dashboard
  startDashboard(client)

  if (prismaEnabled) {
    try {
      await prisma.$connect()
      console.log('[prisma] connected to DB')
    } catch (err) {
      console.error('[prisma] connection error:', err)
    }
  } else {
    console.warn('[prisma] BDD_URL not set — Prisma disabled. DB operations will be skipped.')
  }

  if (prismaEnabled) {
    try {
      await updateGlobalMessage(client)
    } catch (err) {
      console.error('updateGlobalMessage (startup) failed:', err)
    }
  } else {
    console.warn('[startup] skipping updateGlobalMessage because Prisma is disabled')
  }

})

client.login(process.env.TOKEN)
