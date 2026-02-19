import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'

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
    await interaction.reply(`✅ Pseudo de ${user} supprimé avec succès.`)
  } catch (error) {
    await interaction.reply('❌ Erreur lors de la suppression du pseudo.')
    console.error(error)
  }
}
