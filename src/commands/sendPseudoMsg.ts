import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { updateGlobalMessage } from '../functions/updateMessage'

export const data = new SlashCommandBuilder()
  .setName('send-pseudo-msg')
  .setDescription('Envoyer (ou recréer) le message public des pseudos')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

export async function execute(interaction: ChatInputCommandInteraction, client: any) {
  console.log(`[cmd:send-pseudo-msg] /send-pseudo-msg by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  try {
    await updateGlobalMessage(client)
    await interaction.reply({ content: '✅ Message public envoyé / mis à jour.', ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Échec lors de l’envoi du message public.', ephemeral: true })
  }
}
