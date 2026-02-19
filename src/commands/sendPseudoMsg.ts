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
    await interaction.editReply({ embeds: [makeEmbed({ title: 'Message public', description: 'Message public envoyé / mis à jour.', color: 0x00AA00 })] })
  } catch (err) {
    console.error(err)
    try { await interaction.editReply({ embeds: [makeEmbed({ title: 'Erreur', description: 'Échec lors de l’envoi du message public.', color: 0xFF0000 })] }) } catch (_) {}
  }
} 
