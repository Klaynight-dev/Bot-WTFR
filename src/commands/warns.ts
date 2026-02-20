import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import prisma from '../prisma'
import { replyEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('warns')
  .setDescription("Afficher les avertissements d'un utilisateur")
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur (si omis, affichera les warnings de la personne ciblée)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur') || interaction.user
  console.log(`[cmd:warns] /warns by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id}`)
  const userWarnings = await prisma.warning.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } })

  if (userWarnings.length === 0) return replyEmbed(interaction, createEmbed({
    title: 'Avertissements',
    description: '✅ Aucun avertissement pour cet utilisateur.',
    color: Colors.Success
  }))

  const lines = userWarnings.map((w: any, i: number) => {
    return `**#${i + 1}** • <t:${Math.floor(new Date(w.date).getTime() / 1000)}:R> par <@${w.moderatorId}>\n> \`${w.reason}\``
  })

  const embed = createEmbed({
    title: `⚠️ Avertissements — ${user.tag}`,
    description: lines.join('\n\n'),
    color: Colors.Warning,
    footer: `Total: ${userWarnings.length} avertissement(s)`
  })

  await replyEmbed(interaction, embed)
}
