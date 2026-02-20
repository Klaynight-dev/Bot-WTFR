import {
    Interaction,
    ChatInputCommandInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
    Client,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    PermissionFlagsBits,
    TextChannel,
    GuildMember
} from 'discord.js'
import prisma from '../prisma'
import { buildPseudosPage } from '../functions/updateMessage'
import { makeEmbed, getBrandingAttachment, replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const name = 'interactionCreate'
export const once = false

export async function execute(interaction: Interaction, client: Client) {
    try {
        // console.log(`[interaction] id=${interaction.id} type=${interaction.type}`)

        // --- Chat Commands ---
        if (interaction.isChatInputCommand()) {
            const command = (client as any).commands.get(interaction.commandName)
            if (!command) return

            try {
                await command.execute(interaction, client)
            } catch (err) {
                console.error(`[command] /${interaction.commandName} error:`, err)
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Une erreur est survenue.', flags: 64 }).catch(() => { })
                }
            }
            return
        }

        // --- Buttons ---
        if (interaction.isButton()) {
            const id = interaction.customId

            // Ticket: Open
            if (id === 'ticket_open') {
                await handleTicketOpen(interaction)
                return
            }

            // Ticket: Close
            if (id === 'ticket_close') {
                await handleTicketClose(interaction)
                return
            }

            // Legacy: Pseudos Pagination
            if (id === 'pseudos_prev' || id === 'pseudos_next') {
                await handlePseudosPagination(interaction)
                return
            }

            // Legacy: Pseudos Goto
            if (id.startsWith('pseudos_goto_')) {
                await handlePseudosGoto(interaction, client)
                return
            }

            // Legacy: Search Modal Trigger
            if (id === 'pseudos_search') {
                const modal = new ModalBuilder().setCustomId('pseudos_modal_search').setTitle('Rechercher un pseudo')
                const input = new TextInputBuilder().setCustomId('query').setLabel('Discord / affichage / roblox').setStyle(TextInputStyle.Short).setRequired(true)
                modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input))
                await interaction.showModal(modal)
                return
            }
        }

        // --- Modals ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'pseudos_modal_search') {
                await handlePseudosSearch(interaction, client)
                return
            }
        }

    } catch (err) {
        console.error('interaction handler error:', err)
    }
}

// --- Ticket Logic ---

async function handleTicketOpen(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: 64 })

    if (!interaction.guild) return

    // Check if user already has a ticket? (Optional, skipping for now to allow multiple)

    const guildConfig = await prisma.guildConfig.findUnique({ where: { id: interaction.guild.id } })
    const categoryId = guildConfig?.ticketCategoryId

    // Create Channel
    try {
        const channelName = `ticket-${interaction.user.username}`
        const channel = await interaction.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryId || undefined,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles]
                },
                // Add staff role permissions if configured, for now assume Admins/Mods see it if they see the category or are admins
            ]
        })

        await prisma.ticket.create({
            data: {
                channelId: channel.id,
                userId: interaction.user.id,
                closed: false
            }
        })

        const embed = createEmbed({
            title: 'Ticket ouvert',
            description: `Bonjour <@${interaction.user.id}>, expliquez votre problème ici.\nUn membre du staff vous répondra bientôt.`,
            color: Colors.Success,
            footer: 'Support'
        })

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        )

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] })

        await interaction.editReply({ content: `Ticket créé: <#${channel.id}>` })

    } catch (err) {
        console.error('Ticket create error:', err)
        await interaction.editReply({ content: "Erreur lors de la création du ticket." })
    }
}

async function handleTicketClose(interaction: ButtonInteraction) {
    if (!interaction.guild || !interaction.channel) return

    await interaction.reply({ content: 'Le ticket va être supprimé dans 5 secondes...', flags: 64 })

    // updated DB
    await prisma.ticket.updateMany({
        where: { channelId: interaction.channel.id },
        data: { closed: true }
    })

    setTimeout(async () => {
        if (interaction.channel) {
            await interaction.channel.delete().catch(() => { })
        }
    }, 5000)
}

// --- Legacy Pseudos Logic (Moved from index.ts) ---

async function handlePseudosPagination(interaction: ButtonInteraction) {
    const id = interaction.customId
    const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
    const msgRow = await prisma.messageState.findFirst()
    const perPage = 5
    const totalPages = Math.max(1, Math.ceil(pseudos.length / perPage))
    let page = typeof msgRow?.page === 'number' ? msgRow.page : 0

    page = id === 'pseudos_next' ? Math.min(totalPages - 1, page + 1) : Math.max(0, page - 1)

    // Using 'attachment://logo.png' assuming it's what was used before, 
    // or we can use getBrandingAttachment if we want to re-attach.
    // The previous code verified if branding was attached. 
    // Simplified here: reusing the buildPseudosPage logic.

    const payload = buildPseudosPage(pseudos, page, perPage, 'attachment://logo.png')

    if (msgRow) {
        await prisma.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } })
    } else {
        await prisma.messageState.create({ data: { page: payload.page } })
    }

    const branding = getBrandingAttachment()
    // @ts-ignore
    await interaction.update(branding ? {
        embeds: payload.embeds,
        components: payload.components,
        files: [{ attachment: branding.path, name: branding.name }]
    } : {
        embeds: payload.embeds,
        components: payload.components
    })
}

async function handlePseudosGoto(interaction: ButtonInteraction, client: Client) {
    const targetId = interaction.customId.replace('pseudos_goto_', '')
    const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
    const idx = pseudos.findIndex((u: any) => u.id === targetId)
    if (idx === -1) {
        await interaction.reply({ content: 'Utilisateur introuvable dans la liste.', flags: 64 })
        return
    }

    const perPage = 5
    const page = Math.floor(idx / perPage)
    const payload = buildPseudosPage(pseudos, page, perPage, client.user?.displayAvatarURL?.() ?? undefined)

    // edit public embed
    const msgRow = await prisma.messageState.findFirst()
    if (msgRow?.channelId && msgRow?.messageId) {
        try {
            const ch = await client.channels.fetch(msgRow.channelId).catch(() => null)
            if (ch) {
                const msg = await (ch as any).messages.fetch(msgRow.messageId).catch(() => null)
                if (msg) {
                    const branding = getBrandingAttachment()
                    // Simplistic re-attachment check
                    const needsAttachment = Boolean(payload.embeds?.[0]?.data?.footer?.icon_url?.startsWith?.('attachment://'))
                    if (branding && needsAttachment && !(msg.attachments && Array.from(msg.attachments.values()).some((a: any) => a.name === branding.name))) {
                        // @ts-ignore
                        await msg.edit({ embeds: payload.embeds, components: payload.components, files: [{ attachment: branding.path, name: branding.name }] })
                    } else {
                        // @ts-ignore
                        await msg.edit({ embeds: payload.embeds, components: payload.components })
                    }
                    await prisma.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } })
                }
            }
        } catch (err) {
            console.error(err)
        }
    }

    await interaction.reply({ content: '✅ Affiché dans le listing public.', flags: 64 })
}

async function handlePseudosSearch(interaction: ModalSubmitInteraction, client: Client) {
    const q = interaction.fields.getTextInputValue('query').trim()
    const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
    const matches: any[] = []

    const mentionMatch = q.match(/^<@!?(\d+)>$/) || q.match(/^(\d+)$/)
    if (mentionMatch) {
        const id = mentionMatch[1]
        matches.push(...pseudos.filter((u: any) => u.id === id))
    } else {
        const lower = q.toLowerCase()
        matches.push(...pseudos.filter((u: any) => (u.display || '').toLowerCase().includes(lower) || (u.roblox || '').toLowerCase().includes(lower)))
    }

    if (matches.length === 0) {
        await interaction.reply({ content: 'Aucun résultat.', flags: 64 })
        return
    }

    const embed = makeEmbed({
        title: `Résultats pour "${q}"`,
        description: matches.map(u => `• <@${u.id}> — \`${u.display}\` • Roblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`).join('\n'),
        color: 0x5865F2,
        footer: `${matches.length} résultat(s)`,
        footerIconUrl: client.user?.displayAvatarURL?.() ?? undefined
    })

    const gotoRow = new ActionRowBuilder<ButtonBuilder>()
    const linkRow = new ActionRowBuilder<ButtonBuilder>()
    for (let i = 0; i < Math.min(matches.length, 5); i++) {
        gotoRow.addComponents(new ButtonBuilder().setCustomId(`pseudos_goto_${matches[i].id}`).setLabel(`Voir #${i + 1}`).setStyle(ButtonStyle.Primary))
        linkRow.addComponents(new ButtonBuilder().setLabel(`Profil Roblox #${i + 1}`).setStyle(ButtonStyle.Link).setURL(`https://www.roblox.com/users/profile?username=${encodeURIComponent(matches[i].roblox)}`))
    }

    const components: any[] = []
    if (gotoRow.components.length) components.push(gotoRow)
    if (linkRow.components.length) components.push(linkRow)

    const branding = getBrandingAttachment()
    if (branding) {
        // @ts-ignore
        await interaction.reply({ embeds: [embed], components, flags: 64, files: [{ attachment: branding.path, name: branding.name }] })
    } else {
        // @ts-ignore
        await interaction.reply({ embeds: [embed], components, flags: 64 })
    }
}
