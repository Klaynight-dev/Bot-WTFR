import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import path from 'path'
import fs from 'fs'
import prisma from '../prisma'

export const data = new SlashCommandBuilder()
  .setName('exportpseudos')
  .setDescription('Télécharger le fichier pseudos.json')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
  const filePath = path.join(process.cwd(), 'pseudos.json')
  fs.writeFileSync(filePath, JSON.stringify(pseudos, null, 2))
  await interaction.reply({ files: [{ attachment: filePath, name: 'pseudos.json' }], ephemeral: true })
}
