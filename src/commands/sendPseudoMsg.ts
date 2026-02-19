import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js'
import { updateGlobalMessage } from '../functions/updateMessage'

export const data = new SlashCommandBuilder()
  .setName('send-pseudo-msg')
  .setDescription('Envoyer (ou recréer) le message public des pseudos')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

export async function execute(interaction: ChatInputCommandInteraction, client: any) {
  console.log(`[cmd:send-pseudo-msg] /send-pseudo-msg by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  try {
    // deferring so interaction won't expire while updateGlobalMessage runs
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    await updateGlobalMessage(client, true)
    await interaction.editReply({ content: '✅ Message public envoyé / mis à jour.' })
  } catch (err) {
    console.error(err)
    try { await interaction.editReply({ content: '❌ Échec lors de l’envoi du message public.' }) } catch (_) {}
  }
} 
