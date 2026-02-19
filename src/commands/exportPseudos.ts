import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import path from 'path'

export const data = new SlashCommandBuilder()
  .setName('exportpseudos')
  .setDescription('Télécharger le fichier pseudos.json')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  const filePath = path.join(process.cwd(), 'pseudos.json')
  await interaction.reply({ files: [{ attachment: filePath, name: 'pseudos.json' }], ephemeral: true })
}
