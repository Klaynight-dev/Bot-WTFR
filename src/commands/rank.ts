import { SlashCommandBuilder, ChatInputCommandInteraction, AttachmentBuilder } from 'discord.js'
import prisma from '../prisma'
import { createCanvas, loadImage, registerFont } from 'canvas'
import { Levels } from '../utils/levels'
import { Colors } from '../utils/style'

export const data = new SlashCommandBuilder()
    .setName('rank')
    .setDescription("Afficher son niveau ou celui d'un membre")
    .addUserOption(opt => opt.setName('membre').setDescription('Membre ciblé').setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()

    const user = interaction.options.getUser('membre') || interaction.user
    const guildId = interaction.guildId!

    const userData = await prisma.level.findUnique({
        where: { userId_guildId: { userId: user.id, guildId } }
    })

    if (!userData) {
        return interaction.followUp("Ce membre n'a pas encore d'expérience.")
    }

    const currentLevel = userData.level
    const currentXp = userData.xp
    const xpForCurrentLevel = Levels.xpForLevel(currentLevel)
    const xpForNextLevel = Levels.xpForLevel(currentLevel + 1)

    // XP relative to current level progress
    // Wait, my formula for `levelForXp` assumes `xp` is TOTAL accumulated XP.
    // So `xpForLevel(currentLevel)` is the total XP needed to REACH that level.
    // So `currentXp` should be >= `xpForCurrentLevel`.
    // Progress = (currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)

    const xpInLevel = currentXp - xpForCurrentLevel
    const xpNeededForNext = xpForNextLevel - xpForCurrentLevel

    // Rank Position
    const rank = await prisma.level.count({
        where: { guildId, xp: { gt: currentXp } }
    }) + 1

    // CANVAS GENERATION
    const canvas = createCanvas(700, 250)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#23272A'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Avatar
    const avatarURL = user.displayAvatarURL({ extension: 'png' })
    try {
        const avatar = await loadImage(avatarURL)
        ctx.save()
        ctx.beginPath()
        ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(avatar, 25, 25, 200, 200)
        ctx.restore()
    } catch (e) {
        // Fallback if avatar fails
        ctx.fillStyle = '#7289DA'
        ctx.beginPath()
        ctx.arc(125, 125, 100, 0, Math.PI * 2, true)
        ctx.fill()
    }

    // Progress Bar Background
    ctx.fillStyle = '#484B4E'
    ctx.fillRect(250, 180, 420, 40)

    // Progress Bar Fill
    const percent = Math.min(Math.max(xpInLevel / xpNeededForNext, 0), 1)
    ctx.fillStyle = '#5865F2' // Blurple
    ctx.fillRect(250, 180, 420 * percent, 40)

    // Text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText(user.username, 250, 80)

    ctx.font = '24px sans-serif'
    ctx.fillStyle = '#CCCCCC'
    ctx.fillText(`#${user.discriminator === '0' ? '' : user.discriminator}`, 250 + ctx.measureText(user.username).width + 10, 80)

    ctx.font = 'bold 48px sans-serif'
    ctx.fillStyle = '#5865F2'
    ctx.fillText(`Level ${currentLevel}`, 550, 80)

    ctx.font = '28px sans-serif'
    ctx.fillStyle = '#CCCCCC'
    ctx.fillText(`Rank #${rank}`, 250, 130)

    ctx.font = '28px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    const xpText = `${xpInLevel} / ${xpNeededForNext} XP`
    ctx.fillText(xpText, 670 - ctx.measureText(xpText).width, 170)

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank.png' })

    await interaction.followUp({ files: [attachment] })
}
