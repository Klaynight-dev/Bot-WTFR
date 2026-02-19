import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bannir un membre')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'

  if (!interaction.guild) return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', ephemeral: true })

  try {
    // use guild ban via members manager
    await (interaction.guild.members as any).ban(user.id, { reason })
    await interaction.reply({ content: `✅ ${user.tag} banni.`, ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible de bannir ce membre.', ephemeral: true })
  }
}
