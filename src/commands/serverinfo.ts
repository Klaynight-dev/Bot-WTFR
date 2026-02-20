import { SlashCommandBuilder, ChatInputCommandInteraction, ChannelType } from 'discord.js'
import { replyEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription("Affiche les informations sur le serveur")

export async function execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild
    if (!guild) return

    const owner = await guild.fetchOwner()
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size
    const roleCount = guild.roles.cache.size

    const embed = createEmbed({
        title: `${Emojis.Info} Informations sur ${guild.name}`,
        color: Colors.Primary,
        thumbnail: guild.iconURL({ size: 1024 }) || undefined,
        image: guild.bannerURL({ size: 1024 }) || undefined,
        fields: [
            { name: 'Propriétaire', value: `<@${owner.id}>`, inline: true },
            { name: 'ID', value: `\`${guild.id}\``, inline: true },
            { name: 'Membres', value: `${guild.memberCount}`, inline: true },
            { name: 'Salons', value: `📝 ${textChannels} | 🔊 ${voiceChannels}`, inline: true },
            { name: 'Rôles', value: `${roleCount}`, inline: true },
            { name: 'Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D> (<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`, inline: true }
        ],
        footer: `Demandé par ${interaction.user.tag}`
    })

    await replyEmbed(interaction, embed)
}
