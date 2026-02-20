import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js'
import prisma from '../prisma'
import { updateGlobalMessage } from '../functions/updateMessage'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, createSuccessEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription("Définir le salon où poster l'embed public")
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon texte').setRequired(true).addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

export async function execute(interaction: ChatInputCommandInteraction, client: any) {
  const channel = interaction.options.getChannel('channel', true)
  console.log(`[cmd:setchannel] /setchannel by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} -> targetChannel=${channel.id}`)

  // avoid interaction timeout while updateGlobalMessage runs
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const msgRow = await prisma.messageState.findFirst()
  if (msgRow) {
    await prisma.messageState.update({ where: { id: msgRow.id }, data: { channelId: channel.id, messageId: null, page: 0 } })
  } else {
    await prisma.messageState.create({ data: { channelId: channel.id, page: 0 } })
  }

  try {
    await updateGlobalMessage(client, true)
    await replyEphemeralEmbed(interaction, createSuccessEmbed(`Salon de listing défini sur <#${channel.id}>.`))
  } catch (err) {
    console.error(err)
    try { await replyEphemeralEmbed(interaction, createErrorEmbed("Erreur lors de la mise à jour du message public.")) } catch (_) { }
  }
}
