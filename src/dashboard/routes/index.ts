import express, { Router } from 'express'
import prisma from '../../prisma'

const router = Router()

function checkAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}

router.get('/', (req, res) => {
    res.render('index', { user: req.user })
})

router.get('/dashboard', checkAuth, async (req: any, res) => {
    let guildConfig: any[] = []
    try {
        guildConfig = await prisma.guildConfig.findMany()
    } catch (e) {
        console.warn('[Dashboard] GuildConfig table not found, showing empty list')
    }
    res.render('dashboard', { user: req.user, guildConfig })
})

router.get('/dashboard/:guildId', checkAuth, async (req: any, res) => {
    const { guildId } = req.params
    let guildConfig = null
    try {
        guildConfig = await prisma.guildConfig.findUnique({ where: { id: guildId } })
    } catch (e) {
        console.warn('[Dashboard] GuildConfig table not found')
    }
    const guild = req.bot.guilds.cache.get(guildId)

    if (!guild) return res.send("Serveur introuvable ou le bot n'y est pas.")

    res.render('settings', { user: req.user, guild, config: guildConfig || {} })
})

router.post('/dashboard/:guildId', checkAuth, express.urlencoded({ extended: true }), async (req: any, res) => {
    const { guildId } = req.params
    const { logChannelId, welcomeChannelId, autoRole, ticketCategoryId } = req.body

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

    res.redirect(`/dashboard/${guildId}`)
})

export default router
