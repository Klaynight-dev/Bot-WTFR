import { Router } from 'express'
import prisma from '../../prisma'

const router = Router()
const GUILD_ID = process.env.GUILD_ID!

// ─── Auth middleware ───
function checkAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}

// ─── Panel access middleware ───
async function checkPanelAccess(req: any, res: any, next: any) {
    if (!req.isAuthenticated()) return res.redirect('/')

    const client = req.bot
    const guild = client.guilds.cache.get(GUILD_ID)
    if (!guild) return res.status(503).send('Serveur introuvable — le bot doit être en ligne.')

    const userId = req.user.id

    // Owner always has access
    if (guild.ownerId === userId) return next()

    // Check panelUsers list
    let config: any = null
    try {
        config = await prisma.guildConfig.findUnique({ where: { id: GUILD_ID } })
    } catch { }

    if (config?.panelUsers?.includes(userId)) return next()

    // Check panelRoles via guild member
    try {
        const member = await guild.members.fetch(userId)
        if (member) {
            // Admin permission = access
            if (member.permissions.has('Administrator')) return next()

            // Check panelRoles
            if (config?.panelRoles?.length) {
                const hasRole = config.panelRoles.some((roleId: string) =>
                    member.roles.cache.has(roleId)
                )
                if (hasRole) return next()
            }
        }
    } catch { }

    res.status(403).render('forbidden', { user: req.user })
}

// ─── Helper: format uptime ───
function formatUptime(ms: number): string {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

// ─── Home Page ───
router.get('/', (req: any, res) => {
    const client = req.bot
    const stats = {
        uptime: client.uptime ? formatUptime(client.uptime) : '—',
        guilds: client.guilds.cache.size,
        members: client.guilds.cache.reduce((a: number, g: any) => a + g.memberCount, 0),
        commands: client.commands?.size ?? 0
    }
    res.render('index', { user: req.user, stats })
})

// ─── Dashboard (single-server tabs) ───
router.get('/dashboard', checkPanelAccess, async (req: any, res) => {
    const client = req.bot
    const guild = client.guilds.cache.get(GUILD_ID)

    if (!guild) return res.send("Serveur introuvable ou le bot n'y est pas.")

    // Fetch config
    let config: any = {}
    try {
        config = await prisma.guildConfig.findUnique({ where: { id: GUILD_ID } }) || {}
    } catch { }

    // Fetch level config
    let levelConfig: any = null
    try {
        levelConfig = await prisma.levelConfig.findUnique({ where: { guildId: GUILD_ID } })
    } catch { }

    // Fetch level rewards
    let levelRewards: any[] = []
    try {
        levelRewards = await prisma.levelReward.findMany({
            where: { guildId: GUILD_ID },
            orderBy: { level: 'asc' }
        })
    } catch { }

    // Fetch level multipliers
    let levelMultipliers: any[] = []
    try {
        levelMultipliers = await prisma.levelMultiplier.findMany({
            where: { guildId: GUILD_ID }
        })
    } catch { }

    // Fetch command configs
    let commandConfigs: any[] = []
    try {
        commandConfigs = await prisma.commandConfig.findMany({
            where: { guildId: GUILD_ID }
        })
    } catch { }

    // Build command list from bot
    const commandList = Array.from(client.commands?.values() ?? []).map((cmd: any) => {
        const cfg = commandConfigs.find((c: any) => c.commandName === cmd.data.name)
        return {
            name: cmd.data.name,
            description: cmd.data.description,
            enabled: cfg ? cfg.enabled : true,
            allowedRoles: cfg?.allowedRoles ?? [],
            allowedChannels: cfg?.allowedChannels ?? []
        }
    }).sort((a: any, b: any) => a.name.localeCompare(b.name))

    // Fetch recent audit logs
    let auditLogs: any[] = []
    try {
        auditLogs = await prisma.auditLog.findMany({
            where: { guildId: GUILD_ID },
            orderBy: { createdAt: 'desc' },
            take: 50
        })
    } catch { }

    // Fetch moderation stats
    let warnCount = 0
    try {
        warnCount = await prisma.warning.count()
    } catch { }

    let ticketCount = 0
    try {
        ticketCount = await prisma.ticket.count()
    } catch { }

    let openTickets = 0
    try {
        openTickets = await prisma.ticket.count({ where: { closed: false } })
    } catch { }

    // Get channels and roles
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

    // Active tab from query
    const tab = (req.query.tab as string) || 'general'

    res.render('dashboard', {
        user: req.user,
        guild: {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ size: 128 }),
            memberCount: guild.memberCount
        },
        config,
        levelConfig,
        levelRewards,
        levelMultipliers,
        commandList,
        auditLogs,
        modStats: { warns: warnCount, tickets: ticketCount, openTickets },
        textChannels,
        categories,
        roles,
        tab
    })
})

export default router
