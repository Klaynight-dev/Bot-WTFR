import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import prisma from '../prisma'

export const data = new SlashCommandBuilder()
  .setName('exportpseudos')
  .setDescription('Télécharger le fichier pseudos.json')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(`[cmd:exportpseudos] /exportpseudos by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
  const json = JSON.stringify(pseudos, null, 2)
  const buffer = Buffer.from(json, 'utf8')
  await interaction.reply({ files: [{ attachment: buffer, name: 'pseudos.json' }], ephemeral: true })
}
