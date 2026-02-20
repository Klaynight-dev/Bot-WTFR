import { Router } from 'express'
import prisma from '../../prisma'

const router = Router()
const GUILD_ID = process.env.GUILD_ID!

// ─── Auth + Panel Access ───
async function checkApi(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Non authentifié' })

    const client = req.bot
    const guild = client.guilds.cache.get(GUILD_ID)
    if (!guild) return res.status(503).json({ error: 'Serveur introuvable' })

    const userId = req.user.id

    // Owner / Admin always OK
    if (guild.ownerId === userId) return next()

    let config: any = null
    try { config = await prisma.guildConfig.findUnique({ where: { id: GUILD_ID } }) } catch { }

    if (config?.panelUsers?.includes(userId)) return next()

    try {
        const member = await guild.members.fetch(userId)
        if (member?.permissions.has('Administrator')) return next()
        if (config?.panelRoles?.length) {
            if (config.panelRoles.some((r: string) => member.roles.cache.has(r))) return next()
        }
    } catch { }

    res.status(403).json({ error: 'Accès refusé' })
}

router.use(checkApi)

// ─── Helper: log an action ───
async function logAction(userId: string, userName: string, action: string, details?: any) {
    try {
        await prisma.auditLog.create({
            data: {
                guildId: GUILD_ID,
                userId,
                userName,
                action,
                details: details ? JSON.stringify(details) : null,
                source: 'panel'
            }
        })
    } catch (err) {
        console.error('[AuditLog] Error:', err)
    }
}

// ═══════════════════════════════════════════════
// GET /api/stats
// ═══════════════════════════════════════════════
router.get('/stats', (req: any, res) => {
    const client = req.bot
    const uptime = client.uptime ? Math.floor(client.uptime / 1000) : 0

    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = uptime % 60
    const uptimeStr = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

    const guild = client.guilds.cache.get(GUILD_ID)

    res.json({
        uptime: uptimeStr,
        uptimeSeconds: uptime,
        guilds: client.guilds.cache.size,
        members: guild?.memberCount ?? 0,
        commands: client.commands?.size ?? 0
    })
})

// ═══════════════════════════════════════════════
// GET /api/config — Full server config
// ═══════════════════════════════════════════════
router.get('/config', async (_req: any, res) => {
    try {
        let config = await prisma.guildConfig.findUnique({ where: { id: GUILD_ID } })
        if (!config) {
            config = await prisma.guildConfig.create({ data: { id: GUILD_ID } })
        }
        res.json(config)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ═══════════════════════════════════════════════
// POST /api/config — Save server config
// ═══════════════════════════════════════════════
router.post('/config', async (req: any, res) => {
    const {
        logChannelId, modLogChannelId, panelLogChannelId,
        welcomeChannelId, goodbyeChannelId, ticketCategoryId,
        autoRole, staffRoles, panelRoles, panelUsers,
        antiSpam, antiLink, antiInvite, antiMajuscules,
        welcomeMessage, goodbyeMessage, welcomeImageEnabled
    } = req.body

    try {
        await prisma.guildConfig.upsert({
            where: { id: GUILD_ID },
            update: {
                logChannelId: logChannelId || null,
                modLogChannelId: modLogChannelId || null,
                panelLogChannelId: panelLogChannelId || null,
                welcomeChannelId: welcomeChannelId || null,
                goodbyeChannelId: goodbyeChannelId || null,
                ticketCategoryId: ticketCategoryId || null,
                autoRole: autoRole || null,
                staffRoles: Array.isArray(staffRoles) ? staffRoles : [],
                panelRoles: Array.isArray(panelRoles) ? panelRoles : [],
                panelUsers: Array.isArray(panelUsers) ? panelUsers : [],
                antiSpam: !!antiSpam,
                antiLink: !!antiLink,
                antiInvite: !!antiInvite,
                antiMajuscules: !!antiMajuscules,
                welcomeMessage: welcomeMessage || null,
                goodbyeMessage: goodbyeMessage || null,
                welcomeImageEnabled: welcomeImageEnabled !== false
            },
            create: {
                id: GUILD_ID,
                logChannelId: logChannelId || null,
                modLogChannelId: modLogChannelId || null,
                panelLogChannelId: panelLogChannelId || null,
                welcomeChannelId: welcomeChannelId || null,
                goodbyeChannelId: goodbyeChannelId || null,
                ticketCategoryId: ticketCategoryId || null,
                autoRole: autoRole || null,
                staffRoles: Array.isArray(staffRoles) ? staffRoles : [],
                panelRoles: Array.isArray(panelRoles) ? panelRoles : [],
                panelUsers: Array.isArray(panelUsers) ? panelUsers : [],
                antiSpam: !!antiSpam,
                antiLink: !!antiLink,
                antiInvite: !!antiInvite,
                antiMajuscules: !!antiMajuscules,
                welcomeMessage: welcomeMessage || null,
                goodbyeMessage: goodbyeMessage || null,
                welcomeImageEnabled: welcomeImageEnabled !== false
            }
        })

        await logAction(req.user.id, req.user.username, 'config.update', req.body)
        res.json({ success: true })
    } catch (err: any) {
        console.error('[API] Error saving config:', err)
        res.status(500).json({ error: err.message })
    }
})

// ═══════════════════════════════════════════════
// GET /api/commands — List all commands with config
// ═══════════════════════════════════════════════
router.get('/commands', async (req: any, res) => {
    const client = req.bot
    let commandConfigs: any[] = []
    try {
        commandConfigs = await prisma.commandConfig.findMany({ where: { guildId: GUILD_ID } })
    } catch { }

    const commands = Array.from(client.commands?.values() ?? []).map((cmd: any) => {
        const cfg = commandConfigs.find((c: any) => c.commandName === cmd.data.name)
        return {
            name: cmd.data.name,
            description: cmd.data.description,
            enabled: cfg ? cfg.enabled : true,
            allowedRoles: cfg?.allowedRoles ?? [],
            allowedChannels: cfg?.allowedChannels ?? []
        }
    }).sort((a: any, b: any) => a.name.localeCompare(b.name))

    res.json({ commands })
})

// ═══════════════════════════════════════════════
// POST /api/commands/:name — Toggle / configure a command
// ═══════════════════════════════════════════════
router.post('/commands/:name', async (req: any, res) => {
    const { name } = req.params
    const { enabled, allowedRoles, allowedChannels } = req.body

    try {
        await prisma.commandConfig.upsert({
            where: { guildId_commandName: { guildId: GUILD_ID, commandName: name } },
            update: {
                enabled: enabled !== undefined ? !!enabled : true,
                allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
                allowedChannels: Array.isArray(allowedChannels) ? allowedChannels : []
            },
            create: {
                guildId: GUILD_ID,
                commandName: name,
                enabled: enabled !== undefined ? !!enabled : true,
                allowedRoles: Array.isArray(allowedRoles) ? allowedRoles : [],
                allowedChannels: Array.isArray(allowedChannels) ? allowedChannels : []
            }
        })

        await logAction(req.user.id, req.user.username, 'command.toggle', { command: name, enabled })
        res.json({ success: true })
    } catch (err: any) {
        console.error('[API] Error saving command config:', err)
        res.status(500).json({ error: err.message })
    }
})

// ═══════════════════════════════════════════════
// GET /api/logs — Paginated audit logs
// ═══════════════════════════════════════════════
router.get('/logs', async (req: any, res) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 30
    const source = req.query.source as string
    const action = req.query.action as string

    const where: any = { guildId: GUILD_ID }
    if (source) where.source = source
    if (action) where.action = { contains: action }

    try {
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.auditLog.count({ where })
        ])

        res.json({ logs, total, page, pages: Math.ceil(total / limit) })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ═══════════════════════════════════════════════
// GET /api/moderation — Moderation stats
// ═══════════════════════════════════════════════
router.get('/moderation', async (_req: any, res) => {
    try {
        const [warnCount, ticketCount, openTickets, recentWarns] = await Promise.all([
            prisma.warning.count(),
            prisma.ticket.count(),
            prisma.ticket.count({ where: { closed: false } }),
            prisma.warning.findMany({ orderBy: { date: 'desc' }, take: 10 })
        ])

        res.json({
            warns: warnCount,
            tickets: ticketCount,
            openTickets,
            recentWarns
        })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ═══════════════════════════════════════════════
// POST /api/leveling — Save leveling config
// ═══════════════════════════════════════════════
router.post('/leveling', async (req: any, res) => {
    const {
        enabled, messageXpMin, messageXpMax, voiceXp,
        voiceInterval, cooldown, announceChannelId,
        announceMessage, levelUpNotification
    } = req.body

    try {
        await prisma.levelConfig.upsert({
            where: { guildId: GUILD_ID },
            update: {
                enabled: enabled !== undefined ? !!enabled : true,
                messageXpMin: messageXpMin ? parseInt(messageXpMin) : 15,
                messageXpMax: messageXpMax ? parseInt(messageXpMax) : 25,
                voiceXp: voiceXp ? parseInt(voiceXp) : 10,
                voiceInterval: voiceInterval ? parseInt(voiceInterval) : 60,
                cooldown: cooldown ? parseInt(cooldown) : 60,
                announceChannelId: announceChannelId || null,
                announceMessage: announceMessage || null,
                levelUpNotification: levelUpNotification !== false
            },
            create: {
                guildId: GUILD_ID,
                enabled: enabled !== undefined ? !!enabled : true,
                messageXpMin: messageXpMin ? parseInt(messageXpMin) : 15,
                messageXpMax: messageXpMax ? parseInt(messageXpMax) : 25,
                voiceXp: voiceXp ? parseInt(voiceXp) : 10,
                voiceInterval: voiceInterval ? parseInt(voiceInterval) : 60,
                cooldown: cooldown ? parseInt(cooldown) : 60,
                announceChannelId: announceChannelId || null,
                announceMessage: announceMessage || null,
                levelUpNotification: levelUpNotification !== false
            }
        })

        await logAction(req.user.id, req.user.username, 'leveling.update', req.body)
        res.json({ success: true })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ═══════════════════════════════════════════════
// GET /api/channels — Server channels & roles
// ═══════════════════════════════════════════════
router.get('/channels', (req: any, res) => {
    const guild = req.bot.guilds.cache.get(GUILD_ID)
    if (!guild) return res.status(404).json({ error: 'Serveur introuvable' })

    const textChannels = guild.channels.cache
        .filter((c: any) => c.type === 0)
        .map((c: any) => ({ id: c.id, name: c.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const categories = guild.channels.cache
        .filter((c: any) => c.type === 4)
        .map((c: any) => ({ id: c.id, name: c.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const roles = guild.roles.cache
        .filter((r: any) => !r.managed && r.name !== '@everyone')
        .map((r: any) => ({ id: r.id, name: r.name, color: r.hexColor }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name))

    res.json({ textChannels, categories, roles })
})

export default router
