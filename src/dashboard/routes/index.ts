import { Router } from 'express'
import prisma from '../../prisma'

const router = Router()

// ─── Auth middleware ───
function checkAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}

// ─── Helper: format uptime ───
function formatUptime(ms: number): string {
    const totalSec = Math.floor(ms / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

// ─── Home ───
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

// ─── Dashboard (guild list) ───
router.get('/dashboard', checkAuth, async (req: any, res) => {
    const client = req.bot
    let guildConfigs: any[] = []
    try {
        guildConfigs = await prisma.guildConfig.findMany()
    } catch {
        console.warn('[Dashboard] GuildConfig table not found, showing empty list')
    }

    // Enrich configs with guild info from the bot cache
    const guilds = guildConfigs.map((config: any) => {
        const guild = client.guilds.cache.get(config.id)
        return {
            config,
            name: guild?.name ?? 'Serveur inconnu',
            icon: guild?.iconURL({ size: 64 }) ?? null,
            memberCount: guild?.memberCount ?? 0,
            available: !!guild
        }
    })

    res.render('dashboard', { user: req.user, guilds })
})

// ─── Settings (per guild) ───
router.get('/dashboard/:guildId', checkAuth, async (req: any, res) => {
    const { guildId } = req.params
    const guild = req.bot.guilds.cache.get(guildId)

    if (!guild) return res.send("Serveur introuvable ou le bot n'y est pas.")

    let config: any = {}
    try {
        config = await prisma.guildConfig.findUnique({ where: { id: guildId } }) || {}
    } catch {
        console.warn('[Dashboard] GuildConfig table not found')
    }

    // Get channels and roles for select dropdowns
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

    res.render('settings', {
        user: req.user,
        guild: { id: guild.id, name: guild.name, icon: guild.iconURL({ size: 128 }) },
        config,
        textChannels,
        categories,
        roles
    })
})

// ─── POST Settings (fallback for non-JS) ───
router.post('/dashboard/:guildId', checkAuth, async (req: any, res) => {
    const { guildId } = req.params
    const { logChannelId, welcomeChannelId, autoRole, ticketCategoryId } = req.body

    try {
        await prisma.guildConfig.upsert({
            where: { id: guildId },
            update: {
                logChannelId: logChannelId || null,
                welcomeChannelId: welcomeChannelId || null,
                autoRole: autoRole || null,
                ticketCategoryId: ticketCategoryId || null
            },
            create: {
                id: guildId,
                logChannelId: logChannelId || null,
                welcomeChannelId: welcomeChannelId || null,
                autoRole: autoRole || null,
                ticketCategoryId: ticketCategoryId || null
            }
        })
    } catch (err) {
        console.error('[Dashboard] Error saving config:', err)
    }

    res.redirect(`/dashboard/${guildId}`)
})

export default router
