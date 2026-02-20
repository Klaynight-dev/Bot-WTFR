import { Client, VoiceState, TextChannel } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'
import { Levels } from '../utils/levels'

export const name = 'voiceStateUpdate'
export const once = false

// Map to store voice session start times: GuildID-UserID -> Timestamp
const voiceSessions = new Map<string, number>()

export async function execute(oldState: VoiceState, newState: VoiceState, client: Client) {
    if (oldState.guild.id !== newState.guild.id) return
    const guildId = newState.guild.id
    const userId = newState.member?.id
    if (!userId || newState.member?.user.bot) return

    const key = `${guildId}-${userId}`

    // HANDLE XP
    // ---------------------------------------------------------
    try {
        const config = await prisma.levelConfig.findUnique({ where: { guildId } })

        if (config && config.enabled) {
            // User Joined
            if (!oldState.channelId && newState.channelId) {
                voiceSessions.set(key, Date.now())
            }
            // User Left
            else if (oldState.channelId && !newState.channelId) {
                const startTime = voiceSessions.get(key)
                if (startTime) {
                    const now = Date.now()
                    const durationSeconds = (now - startTime) / 1000
                    const interval = config.voiceInterval || 60

                    if (durationSeconds >= interval) {
                        const intervals = Math.floor(durationSeconds / interval)
                        const xpGain = intervals * config.voiceXp

                        if (xpGain > 0) {
                            // Update User Level
                            const userLevel = await prisma.level.upsert({
                                where: { userId_guildId: { userId, guildId } },
                                update: {
                                    xp: { increment: xpGain },
                                    lastVoiceDate: new Date()
                                },
                                create: {
                                    userId,
                                    guildId,
                                    xp: xpGain,
                                    lastVoiceDate: new Date()
                                }
                            })

                            // Level Up Check
                            const currentLevel = userLevel.level
                            const calculatedLevel = Levels.levelForXp(userLevel.xp)

                            if (calculatedLevel > currentLevel) {
                                await prisma.level.update({
                                    where: { userId_guildId: { userId, guildId } },
                                    data: { level: calculatedLevel }
                                })

                                if (config.levelUpNotification) {
                                    const channelId = config.announceChannelId // || logic for default channel?
                                    // Voice level up usually happens when leaving... might be weird to ping in general chat?
                                    // Use config channel or default system channel or log channel
                                    const logChannelId = (await prisma.guildConfig.findUnique({ where: { id: guildId } }))?.logChannelId
                                    const targetChannelId = channelId || logChannelId

                                    if (targetChannelId) {
                                        const channel = newState.guild.channels.cache.get(targetChannelId) as TextChannel
                                        if (channel) {
                                            const msg = config.announceMessage
                                                ? config.announceMessage.replace('{user}', `<@${userId}>`).replace('{level}', `${calculatedLevel}`)
                                                : `Félicitations <@${userId}> ! Tu es passé(e) au niveau **${calculatedLevel}** grâce au vocal ! 🎙️`
                                            await channel.send(msg).catch(() => { })
                                        }
                                    }
                                }

                                // Role Rewards (Copy from messageCreate - ideally refactor to util but duplicating for speed now)
                                const rewards = await prisma.levelReward.findMany({
                                    where: { guildId, level: { lte: calculatedLevel } },
                                    orderBy: { level: 'asc' }
                                })
                                if (rewards.length > 0) {
                                    const member = await newState.guild.members.fetch(userId).catch(() => null)
                                    if (member) {
                                        for (const reward of rewards) {
                                            await member.roles.add(reward.roleId).catch(() => { })
                                        }
                                    }
                                }
                            }
                        }
                    }
                    voiceSessions.delete(key)
                }
            }
        }
    } catch (e) {
        console.error('Error in voice XP:', e)
    }

    // EXISTING LOGGING LOGIC
    // ---------------------------------------------------------
    if (oldState.channelId === newState.channelId) return

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
