import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { makeEmbed, replyEphemeralEmbed } from '../functions/respond'

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
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Pseudo supprimé', description: `Le pseudo de <@${user.id}> a été supprimé.`, color: 0x00AA00 }))
  } catch (error) {
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Erreur lors de la suppression du pseudo.', color: 0xFF0000 }))
    console.error(error)
  }
}
