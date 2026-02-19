import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Expulser un membre')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'

  if (!interaction.guild) return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', ephemeral: true })

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true })

  try {
    await member.kick(reason)
    await interaction.reply({ content: `✅ ${user.tag} expulsé.`, ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible d\'expulser ce membre.', ephemeral: true })
  }
}
