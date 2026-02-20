import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, createSuccessEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Supprimer N messages (bulk delete)')
  .addIntegerOption(opt => opt.setName('amount').setDescription('Nombre de messages (max 100)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(`[cmd:clear] /clear by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} amount=${interaction.options.getInteger('amount')}`)
  const amount = interaction.options.getInteger('amount', true)
  const channel = interaction.channel as any
  if (!channel || typeof channel.bulkDelete !== 'function') return replyEphemeralEmbed(interaction, createErrorEmbed('Commande utilisable uniquement dans un salon texte.'))

  try {
    const deleted = await channel.bulkDelete(Math.min(amount, 100), true)
    await replyEphemeralEmbed(interaction, createSuccessEmbed(`${deleted.size} message(s) supprimé(s).`))
  } catch (err) {
    console.error(err)
    await replyEphemeralEmbed(interaction, createErrorEmbed('Échec lors de la suppression.'))
  }
}
