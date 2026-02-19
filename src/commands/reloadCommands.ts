import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Client } from 'discord.js'
import fs from 'fs'
import path from 'path'

export const data = new SlashCommandBuilder()
  .setName('reload-commands')
  .setDescription('Recharger les commandes sans redémarrer (dev/prod)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

function getCommandsDir() {
  const distPath = path.join(process.cwd(), 'dist', 'commands')
  const srcPath = path.join(process.cwd(), 'src', 'commands')
  if (fs.existsSync(distPath)) return distPath
  return srcPath
}

export async function execute(interaction: ChatInputCommandInteraction, client: any) {
  const commandsDir = getCommandsDir()
  const files = fs.existsSync(commandsDir) ? fs.readdirSync(commandsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts')) : []

  // clear existing
  client.commands.clear()

  for (const file of files) {
    const fp = path.join(commandsDir, file)
    try {
      delete require.cache[require.resolve(fp)]
    } catch (err) {}
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const command = require(fp)
      if (command?.data?.name) client.commands.set(command.data.name, command)
    } catch (err) {
      console.error('failed loading command', fp, err)
    }
  }

  await interaction.reply({ content: `✅ ${client.commands.size} commandes rechargées.`, ephemeral: true })
}
