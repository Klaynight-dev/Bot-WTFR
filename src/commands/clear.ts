import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { makeEmbed, replyEphemeralEmbed } from '../functions/respond'

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Supprimer N messages (bulk delete)')
  .addIntegerOption(opt => opt.setName('amount').setDescription('Nombre de messages (max 100)').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

export async function execute(interaction: ChatInputCommandInteraction) {
  console.log(`[cmd:clear] /clear by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} amount=${interaction.options.getInteger('amount')}`)
  const amount = interaction.options.getInteger('amount', true)
  const channel = interaction.channel as any
  if (!channel || typeof channel.bulkDelete !== 'function') return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Commande utilisable uniquement dans un salon texte.', color: 0xFF0000 }))

  try {
    const deleted = await channel.bulkDelete(Math.min(amount, 100), true)
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Messages supprimés', description: `✅ Supprimé ${deleted.size} message(s).`, color: 0x00AA00 }))
  } catch (err) {
    console.error(err)
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Échec lors de la suppression.', color: 0xFF0000 }))
  }
}
