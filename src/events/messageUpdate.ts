import { Client, Message, TextChannel } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const name = 'messageUpdate'
export const once = false

export async function execute(oldMessage: Message, newMessage: Message, client: Client) {
    if (!oldMessage.guild || oldMessage.author?.bot) return
    if (oldMessage.content === newMessage.content) return // Ignore embed updates etc

    try {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { id: oldMessage.guild.id } })
        if (!guildConfig || !guildConfig.logChannelId) return

        const channel = oldMessage.guild.channels.cache.get(guildConfig.logChannelId) as TextChannel
        if (!channel) return

        const oldContent = oldMessage.content ? oldMessage.content.substring(0, 1024) : '*Aucun contenu*'
        const newContent = newMessage.content ? newMessage.content.substring(0, 1024) : '*Aucun contenu*'

        const embed = createEmbed({
            title: `${Emojis.Info} Message modifié`,
            description: `**Auteur:** <@${oldMessage.author.id}>\n**Salon:** <#${oldMessage.channel.id}>\n[Aller au message](${newMessage.url})`,
            color: Colors.Info,
            fields: [
                { name: 'Avant', value: oldContent },
                { name: 'Après', value: newContent }
            ],
            footer: `ID: ${oldMessage.id}`
        })

        await channel.send({ embeds: [embed] })

    } catch (err) {
        console.error('messageUpdate error:', err)
    }
}
