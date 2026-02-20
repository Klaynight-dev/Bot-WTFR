import { Client, GuildMember, TextChannel } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const name = 'guildMemberRemove'
export const once = false

export async function execute(member: GuildMember, client: Client) {
    try {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { id: member.guild.id } })
        if (!guildConfig || !guildConfig.welcomeChannelId) return // Usually goodbye goes to same channel or we can add a goodbyeChannelId later

        // For now, assume same channel as welcome or check if we want a separate one. 
        // The schema was GuildConfig with welcomeChannelId. 
        // Let's use welcomeChannelId for both for now, or just log it. 
        // Usually people like goodbye messages too.

        const channel = member.guild.channels.cache.get(guildConfig.welcomeChannelId) as TextChannel
        if (!channel) return

        const embed = createEmbed({
            title: `${Emojis.Error} Départ`,
            description: `**${member.user.tag}** a quitté le serveur.\nNous sommes maintenant **${member.guild.memberCount}** membres.`,
            color: Colors.Error,
            footer: `ID: ${member.id}`
        })

        await channel.send({ embeds: [embed] })

    } catch (err) {
        console.error('guildMemberRemove error:', err)
    }
}
