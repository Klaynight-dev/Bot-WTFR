import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Verrouiller un salon (désactive sendMessages pour @everyone)')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  console.log(`[cmd:lock] /lock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`)
  if (!channel || !channel.permissionOverwrites) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Salon invalide.', color: 0xFF0000 }))

  try {
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false } as any)
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Salon verrouillé', description: `🔒 ${channel.name}`, color: 0xFF9900 }))
  } catch (err) {
    console.error(err)
    await replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Impossible de verrouiller le salon.', color: 0xFF0000 }))
  }
}
