import { Client, Message, TextChannel, AuditLogEvent } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const name = 'messageDelete'
export const once = false

export async function execute(message: Message, client: Client) {
    if (!message.guild || message.author?.bot) return

    try {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { id: message.guild.id } })
        if (!guildConfig || !guildConfig.logChannelId) return

        const channel = message.guild.channels.cache.get(guildConfig.logChannelId) as TextChannel
        if (!channel) return

        const content = message.content ? message.content.substring(0, 1024) : '*Aucun contenu texte*'

        // Attempt to fetch audit logs to see who deleted it (not always accurate/available)
        let executor = null
        try {
            const fetchedLogs = await message.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MessageDelete,
            })
            const deletionLog = fetchedLogs.entries.first()
            if (deletionLog && deletionLog.target.id === message.author.id && deletionLog.createdTimestamp > (Date.now() - 5000)) {
                executor = deletionLog.executor
            }
        } catch (e) { }

        const embed = createEmbed({
            title: `${Emojis.Error} Message supprimé`,
            description: `**Auteur:** <@${message.author.id}>\n**Salon:** <#${message.channel.id}>\n${executor ? `**Supprimé par:** <@${executor.id}>\n` : ''}`,
            color: Colors.Error,
            fields: [
                { name: 'Contenu', value: content }
            ],
            footer: `ID: ${message.id}`
        })

        // Add attachments info if any
        if (message.attachments.size > 0) {
            embed.addFields({ name: 'Pièces jointes', value: `${message.attachments.size} fichier(s)` })
        }

        await channel.send({ embeds: [embed] })

    } catch (err) {
        console.error('messageDelete error:', err)
    }
}
