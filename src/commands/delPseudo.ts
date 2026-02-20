import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, createSuccessEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('delpseudo')
  .setDescription("Supprime le pseudo d'un utilisateur")
  .addUserOption(option => option.setName('utilisateur').setDescription("L'utilisateur dont supprimer le pseudo").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: any) {
  const user = interaction.options.getUser('utilisateur')
  console.log(`[cmd:delpseudo] /delpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id}`)
  const member = await interaction.guild.members.fetch(user.id)

  try {
    await member.setNickname(null)
    await replyEphemeralEmbed(interaction, createSuccessEmbed(`Le pseudo de <@${user.id}> a été supprimé.`))
  } catch (error) {
    await replyEphemeralEmbed(interaction, createErrorEmbed('Erreur lors de la suppression du pseudo.'))
    console.error(error)
  }
}
