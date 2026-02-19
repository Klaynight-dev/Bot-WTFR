import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, MessageFlags } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Déverrouiller un salon')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  console.log(`[cmd:unlock] /unlock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`)
  if (!channel || !channel.permissionOverwrites) return interaction.reply({ content: 'Salon invalide.', flags: MessageFlags.Ephemeral })

  try {
    // retirer l'override (mettre à null)
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null } as any)
    await interaction.reply({ content: `🔓 Salon déverrouillé : ${channel.name}`, flags: MessageFlags.Ephemeral })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible de déverrouiller le salon.', flags: MessageFlags.Ephemeral })
  }
}
