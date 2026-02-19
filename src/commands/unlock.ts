import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Déverrouiller un salon')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  if (!channel || !channel.permissionOverwrites) return interaction.reply({ content: 'Salon invalide.', ephemeral: true })

  try {
    // retirer l'override (mettre à null)
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null } as any)
    await interaction.reply({ content: `🔓 Salon déverrouillé : ${channel.name}`, ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible de déverrouiller le salon.', ephemeral: true })
  }
}
