import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import prisma from '../prisma'
import { makeEmbed } from '../functions/respond'

export const data = new SlashCommandBuilder()
  .setName('exportpseudos')
  .setDescription('Télécharger le fichier pseudos.json')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(`[cmd:exportpseudos] /exportpseudos by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
  const json = JSON.stringify(pseudos, null, 2)
  const buffer = Buffer.from(json, 'utf8')
  const embed = makeEmbed({ title: 'Export des pseudos', description: `${pseudos.length} pseudo(s) exporté(s).`, color: 0x5865F2 })
  await interaction.reply({ embeds: [embed], files: [{ attachment: buffer, name: 'pseudos.json' }], ephemeral: true })
}
