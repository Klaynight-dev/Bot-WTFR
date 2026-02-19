import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Verrouiller un salon (désactive sendMessages pour @everyone)')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  console.log(`[cmd:lock] /lock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`)
  if (!channel || !channel.permissionOverwrites) return interaction.reply({ content: 'Salon invalide.', ephemeral: true })

  try {
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false } as any)
    await interaction.reply({ content: `🔒 Salon verrouillé : ${channel.name}`, ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible de verrouiller le salon.', ephemeral: true })
  }
}
