import { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { makeEmbed, getBrandingAttachment } from './respond'
import prisma, { prismaEnabled } from '../prisma'

export async function getPseudos(): Promise<any[]> {
  if (!prismaEnabled) return []
  return prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
}

export function buildPseudosPage(pseudos: any[] = [], page = 0, perPage = 5, footerIconUrl?: string) {
  const total = Array.isArray(pseudos) ? pseudos.length : 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  page = Math.max(0, Math.min(page, totalPages - 1))
  const start = page * perPage
  const items = (pseudos || []).slice(start, start + perPage)

  // Use fields for improved readability (one pseudo per field)
  const fields = items.length
    ? items.map(u => ({
        name: `\u200B`,
        value: `**<@${u.id}> — \`${u.display}\`**\nRoblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`,
        inline: false
      }))
    : [{ name: '\u200B', value: '_Aucun pseudo enregistré._', inline: false }]

  const embed = makeEmbed({
    title: 'Pseudos enregistrés — WTFR',
    description: `Affichage ${start + 1}-${Math.min(start + items.length, total)} • Total: ${total}`,
    color: 0x5865F2,
    fields,
    footer: `Page ${page + 1}/${totalPages} • ${total} pseudos`,
    footerIconUrl
  })

  // add author + thumbnail if branding icon provided
  if (footerIconUrl) {
    try { embed.setAuthor({ name: 'WarBot FR', iconURL: footerIconUrl }) } catch (err) { /* ignore */ }
    try { embed.setThumbnail(footerIconUrl) } catch (err) { /* ignore */ }
  }

  const prev = new ButtonBuilder().setCustomId('pseudos_prev').setLabel('⬅️ Précédent').setStyle(ButtonStyle.Primary).setDisabled(page <= 0)
  const search = new ButtonBuilder().setCustomId('pseudos_search').setLabel('🔎 Rechercher').setStyle(ButtonStyle.Secondary)
  const next = new ButtonBuilder().setCustomId('pseudos_next').setLabel('Suivant ➡️').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1)

  const row = new ActionRowBuilder().addComponents(prev, search, next)

  return { embeds: [embed], components: [row], page, totalPages }
}

export async function updateGlobalMessage(client: Client, createIfMissing = false) {
  try {
    console.log('[updateGlobalMessage] invoked (createIfMissing=' + Boolean(createIfMissing) + ')')
    if (!prismaEnabled) {
      console.warn('[updateGlobalMessage] Prisma disabled — skipping DB operations')
      return
    }
    console.log('[updateGlobalMessage] fetching pseudos from DB (timeout 5s)...')
    const pseudos = await Promise.race([
      getPseudos(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('getPseudos timed out after 5000ms')), 5000))
    ]) as any[]
    console.log(`[updateGlobalMessage] fetched pseudos=${Array.isArray(pseudos) ? pseudos.length : 'N/A'}`)

    console.log('[updateGlobalMessage] fetching messageState from DB (timeout 5s)...')
    const msgRow: any = await Promise.race([
      prisma.messageState.findFirst(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('messageState.findFirst timed out after 5000ms')), 5000))
    ])
    console.log(`[updateGlobalMessage] messageState=${JSON.stringify(msgRow)}`)

    const messageId = msgRow?.messageId
    const storedChannelId = msgRow?.channelId
    const preferredChannelId = storedChannelId || process.env.CHANNEL_ID
    const currentPage = typeof msgRow?.page === 'number' ? msgRow.page : 0

    console.log(`[updateGlobalMessage] start — page=${currentPage} preferredChannel=${preferredChannelId} messageId=${messageId}`)

    const payload = buildPseudosPage(pseudos, currentPage, 5, client.user?.displayAvatarURL?.() ?? undefined)

    // try éditer le message existant (préférer channel sauvegardé)
    if (messageId) {
      if (storedChannelId) {
        try {
          const ch = await client.channels.fetch(storedChannelId).catch(() => null)
          if (ch && typeof (ch as any).messages?.fetch === 'function') {
            const msg = await (ch as any).messages.fetch(messageId).catch(() => null)
            if (msg) {
              console.log(`[updateGlobalMessage] editing message ${messageId} in channel ${(ch as any).id}`)
              const branding = getBrandingAttachment()
              const needsAttachment = Boolean(payload.embeds?.[0]?.data?.footer?.icon_url?.startsWith?.('attachment://'))
                if (branding && needsAttachment && !(msg.attachments && Array.from(msg.attachments.values()).some((a: any) => a.name === branding.name))) {
                await msg.edit({ embeds: payload.embeds, components: payload.components, files: [{ attachment: branding.path, name: branding.name }] })
              } else {
                await msg.edit({ embeds: payload.embeds, components: payload.components })
              }
              if (msgRow?.id) {
                await prisma.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } })
              } else {
                await prisma.messageState.create({ data: { messageId: msg.id, channelId: (ch as any).id, page: payload.page } })
              }
              return
            }
          }
        } catch (err) {
          // ignore
        }
      }

      for (const channel of client.channels.cache.values()) {
        if (typeof (channel as any).messages?.fetch !== 'function') continue
        try {
          const msg = await (channel as any).messages.fetch(messageId).catch(() => null)
          if (msg) {
            console.log(`[updateGlobalMessage] found message ${messageId} in channel ${(channel as any).id} — editing`)
            const branding = getBrandingAttachment()
            const needsAttachment = Boolean(payload.embeds?.[0]?.data?.footer?.icon_url?.startsWith?.('attachment://'))
              if (branding && needsAttachment && !(msg.attachments && Array.from(msg.attachments.values()).some((a: any) => a.name === branding.name))) {
              await msg.edit({ embeds: payload.embeds, components: payload.components, files: [{ attachment: branding.path, name: branding.name }] })
            } else {
              await msg.edit({ embeds: payload.embeds, components: payload.components })
            }
            if (msgRow?.id) {
              await prisma.messageState.update({ where: { id: msgRow.id }, data: { channelId: (channel as any).id, page: payload.page } })
            } else {
              await prisma.messageState.create({ data: { messageId: msg.id, channelId: (channel as any).id, page: payload.page } })
            }
            return
          }
        } catch (err) {
          // ignore
        }
      }
    }

    // créer un nouveau message si nécessaire (création contrôlée par createIfMissing)
    if (!createIfMissing) {
      console.log('[updateGlobalMessage] message missing and createIfMissing=false — skipping message creation')
      return
    }

    let targetChannel: any = null
    if (preferredChannelId) {
      try {
        const ch = await client.channels.fetch(preferredChannelId).catch(() => null)
        if (ch && ch.isTextBased && (ch as any).permissionsFor?.(ch.guild?.members?.me).has?.('SendMessages' as any)) {
          targetChannel = ch
        }
      } catch (err) {
        // ignore
      }
    }

    if (!targetChannel) {
      const guild = client.guilds.cache.first()
      if (!guild) return
      targetChannel = guild.channels.cache.find((ch: any) => ch.isTextBased && ch.permissionsFor(guild.members.me).has('SendMessages' as any))
      if (!targetChannel) return
    }

    console.log(`[updateGlobalMessage] creating new message in channel ${targetChannel.id}`)
    const branding = getBrandingAttachment()
    const newMsg = await targetChannel.send({ embeds: payload.embeds, components: payload.components, ...(branding ? { files: [{ attachment: branding.path, name: branding.name }] } : {}) })
    if (msgRow?.id) {
      await prisma.messageState.update({ where: { id: msgRow.id }, data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } })
    } else {
      await prisma.messageState.create({ data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } })
    }
  } catch (err) {
    console.error('updateGlobalMessage error:', err && (err.stack || err.message) ? (err.stack || err) : err)
    // rethrow so callers (commands) can react and finish deferred replies
    throw err
  }
}
