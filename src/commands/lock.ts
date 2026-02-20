import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Verrouiller un salon (désactive sendMessages pour @everyone)')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  console.log(`[cmd:lock] /lock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`)
  if (!channel || !channel.permissionOverwrites) return replyEphemeralEmbed(interaction, createErrorEmbed('Salon invalide.'))

  try {
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: false } as any)

    const embed = createEmbed({
      title: `${Emojis.Warning} Salon verrouillé`,
      description: `Le salon <#${channel.id}> a été verrouillé.`,
      color: Colors.Warning,
      footer: 'Les membres ne peuvent plus envoyer de messages.'
    })

    await replyEphemeralEmbed(interaction, embed)
  } catch (err) {
    console.error(err)
    await replyEphemeralEmbed(interaction, createErrorEmbed('Impossible de verrouiller le salon.'))
  }
}
