import { Events, Message, EmbedBuilder } from 'discord.js'
import prisma from '../prisma'
import { Colors } from '../utils/style'
import { Levels } from '../utils/levels'

export const name = Events.MessageCreate

// Map to store cooldowns: GuildID-UserID -> Timestamp
const cooldowns = new Map<string, number>()

export async function execute(message: Message) {
    if (message.author.bot || !message.guild) return

    const guildId = message.guild.id
    const userId = message.author.id
    const key = `${guildId}-${userId}`

    // Check Config
    const config = await prisma.levelConfig.findUnique({ where: { guildId } })
    if (!config || !config.enabled) return

    // Check Cooldown
    const now = Date.now()
    const lastXp = cooldowns.get(key) || 0
    const cooldownMs = config.cooldown * 1000

    if (now - lastXp < cooldownMs) return

    // Calculate XP
    let xpGain = Math.floor(Math.random() * (config.messageXpMax - config.messageXpMin + 1)) + config.messageXpMin

    // Apply Multipliers
    const multipliers = await prisma.levelMultiplier.findMany({ where: { guildId } })
    if (multipliers.length > 0) {
        const member = message.member
        if (member) {
            let totalMult = 1.0
            for (const m of multipliers) {
                if (m.type === 'USER' && m.targetId === userId) totalMult *= m.multiplier
                if (m.type === 'CHANNEL' && m.targetId === message.channelId) totalMult *= m.multiplier
                if (m.type === 'ROLE' && member.roles.cache.has(m.targetId)) totalMult *= m.multiplier
            }
            xpGain = Math.floor(xpGain * totalMult)
        }
    }

    // Update Cooldown
    cooldowns.set(key, now)

    // Update User Level
    const userLevel = await prisma.level.upsert({
        where: { userId_guildId: { userId, guildId } },
        update: {
            xp: { increment: xpGain },
            lastMessageDate: new Date()
        },
        create: {
            userId,
            guildId,
            xp: xpGain,
            lastMessageDate: new Date()
        }
    })

    // Level Up Check
    const currentLevel = userLevel.level
    const calculatedLevel = Levels.levelForXp(userLevel.xp)

    if (calculatedLevel > currentLevel) {
        // Level Up!
        await prisma.level.update({
            where: { userId_guildId: { userId, guildId } },
            data: { level: calculatedLevel }
        })

        if (config.levelUpNotification) {
            const channelId = config.announceChannelId || message.channelId
            const channel = message.guild.channels.cache.get(channelId)

            if (channel && channel.isTextBased()) {
                const msg = config.announceMessage
                    ? config.announceMessage.replace('{user}', `<@${userId}>`).replace('{level}', `${calculatedLevel}`)
                    : `Félicitations <@${userId}> ! Tu es passé(e) au niveau **${calculatedLevel}** ! 🎉`

                await channel.send(msg).catch(() => { })
            }
        }

        // Role Rewards
        const rewards = await prisma.levelReward.findMany({
            where: { guildId, level: { lte: calculatedLevel } },
            orderBy: { level: 'asc' }
        })

        if (rewards.length > 0) {
            const member = await message.guild.members.fetch(userId).catch(() => null)
            if (member) {
                for (const reward of rewards) {
                    // If stack is false, we might want to remove previous roles? 
                    // Implementation plan simplified: "Stackable: Keep previous roles."
                    // If specific reward has stack=false, it means IT removes previous rewards? 
                    // Or just creating a mode where only the highest role is kept?
                    // Let's assume cumulative unless the reward explicitly replaces?
                    // For now, just add roles.
                    await member.roles.add(reward.roleId).catch(() => { })
                }
            }
        }
    }
}
