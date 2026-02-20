import { Router } from 'express'
import prisma from '../../prisma'

const router = Router()

// ─── Middleware: require auth for all API routes ───
function checkAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next()
    res.status(401).json({ error: 'Non authentifié' })
}

router.use(checkAuth)

// ─── GET /api/stats ───
router.get('/stats', (req: any, res) => {
    const client = req.bot
    const uptime = client.uptime ? Math.floor(client.uptime / 1000) : 0

    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60
    const uptimeStr = hours > 0
        ? `${hours}h ${minutes}m`
        : minutes > 0
            ? `${minutes}m ${seconds}s`
            : `${seconds}s`

    const guildsCount = client.guilds.cache.size
    const membersCount = client.guilds.cache.reduce(
        (acc: number, g: any) => acc + g.memberCount, 0
    )
    const commandsCount = client.commands?.size ?? 0

    res.json({
        uptime: uptimeStr,
        uptimeSeconds: uptime,
        guilds: guildsCount,
        members: membersCount,
        commands: commandsCount
    })
})

// ─── POST /api/guild/:guildId/settings ───
router.post('/guild/:guildId/settings', async (req: any, res) => {
    const { guildId } = req.params
    const {
        logChannelId,
        welcomeChannelId,
        autoRole,
        ticketCategoryId,
        antiSpam,
        antiLink
    } = req.body

    try {
        await prisma.guildConfig.upsert({
            where: { id: guildId },
            update: {
                logChannelId: logChannelId || null,
                welcomeChannelId: welcomeChannelId || null,
                autoRole: autoRole || null,
                ticketCategoryId: ticketCategoryId || null,
                antiSpam: !!antiSpam,
                antiLink: !!antiLink
            },
            create: {
                id: guildId,
                logChannelId: logChannelId || null,
                welcomeChannelId: welcomeChannelId || null,
                autoRole: autoRole || null,
                ticketCategoryId: ticketCategoryId || null,
                antiSpam: !!antiSpam,
                antiLink: !!antiLink
            }
        })
        res.json({ success: true })
    } catch (err: any) {
        console.error('[API] Error saving guild config:', err)
        res.status(500).json({ error: err.message || 'Erreur serveur' })
    }
})

// ─── GET /api/guild/:guildId/channels ───
router.get('/guild/:guildId/channels', (req: any, res) => {
    const { guildId } = req.params
    const guild = req.bot.guilds.cache.get(guildId)
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' })

    const textChannels = guild.channels.cache
        .filter((c: any) => c.type === 0) // GuildText
        .map((c: any) => ({ id: c.id, name: c.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const categories = guild.channels.cache
        .filter((c: any) => c.type === 4) // GuildCategory
        .map((c: any) => ({ id: c.id, name: c.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    res.json({ textChannels, categories })
})

// ─── GET /api/guild/:guildId/roles ───
router.get('/guild/:guildId/roles', (req: any, res) => {
    const { guildId } = req.params
    const guild = req.bot.guilds.cache.get(guildId)
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' })

    const roles = guild.roles.cache
        .filter((r: any) => !r.managed && r.name !== '@everyone')
        .map((r: any) => ({ id: r.id, name: r.name, color: r.hexColor }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    res.json({ roles })
})

export default router
