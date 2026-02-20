import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('unlock')
  .setDescription('Déverrouiller un salon')
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel('channel') || interaction.channel) as any
  console.log(`[cmd:unlock] /unlock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`)
  if (!channel || !channel.permissionOverwrites) return replyEphemeralEmbed(interaction, createErrorEmbed('Salon invalide.'))

  try {
    // retirer l'override (mettre à null)
    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, { SendMessages: null } as any)

    const embed = createEmbed({
      title: `${Emojis.Success} Salon déverrouillé`,
      description: `Le salon <#${channel.id}> a été déverrouillé.`,
      color: Colors.Success,
      footer: 'Les membres peuvent à nouveau envoyer des messages.'
    })

    await replyEphemeralEmbed(interaction, embed)
  } catch (err) {
    console.error(err)
    await replyEphemeralEmbed(interaction, createErrorEmbed('Impossible de déverrouiller le salon.'))
  }
}
