import { Client, GuildMember, AttachmentBuilder, TextChannel } from 'discord.js'
import { createCanvas as createCanvasNode, loadImage as loadImageNode } from 'canvas'
import path from 'path'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'

// Helper to draw rounded rect
function roundedImage(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
    ctx.clip()
}

export const name = 'guildMemberAdd'
export const once = false

export async function execute(member: GuildMember, client: Client) {
    try {
        const guildConfig = await prisma.guildConfig.findUnique({ where: { id: member.guild.id } })
        if (!guildConfig || !guildConfig.welcomeChannelId) return

        const channel = member.guild.channels.cache.get(guildConfig.welcomeChannelId) as TextChannel
        if (!channel) return

        // Create Canvas
        const width = 1024
        const height = 450
        const canvas = createCanvasNode(width, height)
        const ctx = canvas.getContext('2d')

        // Background - Gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, '#5865F2')
        gradient.addColorStop(1, '#000000')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Add noise or pattern if possible, kept simple for now

        // Draw Text
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 72px Sans'
        ctx.textAlign = 'center'
        ctx.fillText('BIENVENUE', width / 2, height / 2 + 50)

        ctx.font = '48px Sans'
        ctx.fillText(member.user.username.toUpperCase(), width / 2, height / 2 + 120)

        ctx.font = '32px Sans'
        ctx.fillStyle = '#dddddd'
        ctx.fillText(`Membre #${member.guild.memberCount}`, width / 2, height / 2 + 170)

        // Avatar
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 })
        try {
            const avatar = await loadImageNode(avatarURL)
            const avatarSize = 250
            const avatarX = (width - avatarSize) / 2
            const avatarY = 50

            ctx.save()
            ctx.beginPath()
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true)
            ctx.closePath()
            ctx.clip()
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
            ctx.restore()

            // Outline
            ctx.beginPath()
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 10
            ctx.stroke()

        } catch (err) {
            console.error('Failed to load avatar', err)
        }

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome.png' })

        const embed = createEmbed({
            title: `${Emojis.Success} Nouveau membre !`,
            description: `Bienvenue <@${member.id}> sur **${member.guild.name}** !\nNous sommes maintenant **${member.guild.memberCount}** membres.`,
            color: Colors.Success,
            image: 'attachment://welcome.png',
            footer: `ID: ${member.id}`
        })

        await channel.send({ content: `<@${member.id}>`, embeds: [embed], files: [attachment] })

        // Auto-role
        if (guildConfig.autoRole) {
            const role = member.guild.roles.cache.get(guildConfig.autoRole)
            if (role) {
                await member.roles.add(role).catch(err => console.error('Failed to add auto role:', err))
            }
        }

    } catch (err) {
        console.error('guildMemberAdd error:', err)
    }
}
