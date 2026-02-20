import { Client, VoiceState, TextChannel } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const name = 'voiceStateUpdate'
export const once = false

export async function execute(oldState: VoiceState, newState: VoiceState, client: Client) {
    if (oldState.guild.id !== newState.guild.id) return
    if (oldState.channelId === newState.channelId) return // Mute/Deafen update, ignore for now

    try {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { id: newState.guild.id } })
        if (!guildConfig || !guildConfig.logChannelId) return

        const channel = newState.guild.channels.cache.get(guildConfig.logChannelId) as TextChannel
        if (!channel) return

        let description = ''
        let color = Colors.Info
        let title = 'Vocal'

        if (!oldState.channelId && newState.channelId) {
            // Join
            title = `${Emojis.Success} Connexion Vocal`
            description = `<@${newState.member?.id}> a rejoint <#${newState.channelId}>`
            color = Colors.Success
        } else if (oldState.channelId && !newState.channelId) {
            // Leave
            title = `${Emojis.Error} Déconnexion Vocal`
            description = `<@${oldState.member?.id}> a quitté <#${oldState.channelId}>`
            color = Colors.Error
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // Move
            title = `${Emojis.Info} Changement Vocal`
            description = `<@${newState.member?.id}> a bougé de <#${oldState.channelId}> vers <#${newState.channelId}>`
            color = Colors.Info
        }

        const embed = createEmbed({
            title,
            description,
            color,
            timestamp: true,
            footer: `ID: ${newState.member?.id}`
        })

        await channel.send({ embeds: [embed] })

    } catch (err) {
        console.error('voiceStateUpdate error:', err)
    }
}
