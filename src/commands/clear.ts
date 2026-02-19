import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Supprimer N messages (bulk delete)')
  .addIntegerOption(opt => opt.setName('amount').setDescription('Nombre de messages (max 100)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(`[cmd:clear] /clear by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} amount=${interaction.options.getInteger('amount')}`)
  const amount = interaction.options.getInteger('amount', true)
  const channel = interaction.channel as any
  if (!channel || typeof channel.bulkDelete !== 'function') return interaction.reply({ content: 'Commande utilisable uniquement dans un salon texte.', ephemeral: true })

  try {
    const deleted = await channel.bulkDelete(Math.min(amount, 100), true)
    await interaction.reply({ content: `✅ Supprimé ${deleted.size} message(s).`, ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Échec lors de la suppression.', ephemeral: true })
  }
}
