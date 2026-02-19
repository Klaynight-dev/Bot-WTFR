import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('tempban')
  .setDescription('Bannir temporairement un membre (ne survive pas au redémarrage)')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
  .addIntegerOption(opt => opt.setName('minutes').setDescription('Durée en minutes').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const minutes = interaction.options.getInteger('minutes', true)
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'

  if (!interaction.guild) return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', ephemeral: true })

  try {
    await (interaction.guild.members as any).ban(user.id, { reason })
    await interaction.reply({ content: `✅ ${user.tag} banni pour ${minutes} minute(s). (attention : ne survive pas au redémarrage du bot)`, ephemeral: true })

    const ms = minutes * 60 * 1000
    setTimeout(async () => {
      try {
        await (interaction.guild as any).members.unban(user.id)
        console.log(`Tempban retiré pour ${user.id}`)
      } catch (err) {
        console.error('failed to unban (tempban):', err)
      }
    }, ms)
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible de bannir ce membre.', ephemeral: true })
  }
}
