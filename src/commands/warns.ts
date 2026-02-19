import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js'
import prisma from '../prisma'

export const data = new SlashCommandBuilder()
  .setName('warns')
  .setDescription("Afficher les avertissements d'un utilisateur")
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur (si omis, affichera les warnings de la personne ciblée)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur') || interaction.user
  console.log(`[cmd:warns] /warns by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id}`)
  const userWarnings = await prisma.warning.findMany({ where: { userId: user.id }, orderBy: { date: 'desc' } })

  if (userWarnings.length === 0) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Avertissements', description: 'Aucun avertissement pour cet utilisateur.', color: 0xFFA500 }))

  const embed = new EmbedBuilder()
    .setTitle(`Avertissements — ${user.tag}`)
    .setDescription(userWarnings.map((w: any, i: number) => `**${i + 1}.** ${w.reason} — <@${w.moderatorId}> (${new Date(w.date).toLocaleString()})`).join('\n'))
    .setColor(0xFFA500)

  await replyEphemeralEmbed(interaction, embed)
}
