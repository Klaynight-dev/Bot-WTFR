import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription("Afficher le classement du serveur")

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply()
    const guildId = interaction.guildId!

    const topUsers = await prisma.level.findMany({
        where: { guildId },
        orderBy: { xp: 'desc' },
        take: 10
    })

    if (topUsers.length === 0) {
        return interaction.followUp("Le classement est vide pour le moment.")
    }

    const lines = []
    for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i]
        const medals = ['🥇', '🥈', '🥉']
        const rank = medals[i] || `**#${i + 1}**`

        // Fetch user tag could be slow for many, but for 10 it's ok.
        // Ideally we cache or just use ID if fetch fails.
        let userTag = `<@${u.userId}>`

        // Try to fetch member from cache first
        const member = interaction.guild?.members.cache.get(u.userId)
        if (member) userTag = member.user.tag

        lines.push(`${rank} • <@${u.userId}> — Niveau **${u.level}** (${u.xp} XP)`)
    }

    const embed = createEmbed({
        title: `🏆 Classement — ${interaction.guild?.name}`,
        description: lines.join('\n'),
        color: Colors.Warning, // Gold-ish
        footer: 'Top 10 des membres les plus actifs'
    })

    await interaction.followUp({ embeds: [embed] })
}
