import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Déverrouiller un salon')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  console.log(`[cmd:unlock] /unlock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`)
  if (!channel || !channel.permissionOverwrites) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Salon invalide.', color: 0xFF0000 }))

  try {
    // retirer l'override (mettre à null)
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null } as any)
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Salon déverrouillé', description: `🔓 ${channel.name}`, color: 0x00AA00 }))
  } catch (err) {
    console.error(err)
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Impossible de déverrouiller le salon.', color: 0xFF0000 }))
  }
}
