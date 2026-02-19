import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js'
import prisma from '../prisma'

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription("Ajouter un avertissement à un utilisateur")
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison', true)
  console.log(`[cmd:warn] /warn by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} reason=${reason}`)
  await prisma.warning.create({ data: { userId: user.id, moderatorId: interaction.user.id, reason } })

  await interaction.reply({ content: `⚠️ ${user.tag} averti.`, flags: MessageFlags.Ephemeral })
}
