import fs from 'fs'
import path from 'path'
import { EmbedBuilder, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import prisma from '../prisma'

const PSEUDOS_FILE = path.join(process.cwd(), 'pseudos.json')
const MESSAGE_STATE_FILE = path.join(process.cwd(), 'messageId.json')

export async function getPseudos(): Promise<any[]> {
  try {
    return await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
  } catch (err) {
    try {
      if (fs.existsSync(PSEUDOS_FILE)) {
        return JSON.parse(fs.readFileSync(PSEUDOS_FILE, 'utf8') || '[]')
      }
    } catch (_) {
      // ignore
    }
    return []
  }
}

export function buildPseudosPage(pseudos: any[] = [], page = 0, perPage = 5) {
  const total = Array.isArray(pseudos) ? pseudos.length : 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  page = Math.max(0, Math.min(page, totalPages - 1))
  const start = page * perPage
  const items = (pseudos || []).slice(start, start + perPage)

  const description = items.length
    ? items.map(u => `• <@${u.id}> — \`${u.display}\` • Roblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`).join('\n')
    : '_Aucun pseudo enregistré._'

  const embed = new EmbedBuilder()
    .setTitle('Pseudos enregistrés — WTFR')
    .setColor(0x5865F2)
    .setDescription(description)
    .setFooter({ text: `Page ${page + 1}/${totalPages} • ${total} pseudos` })

  const prev = new ButtonBuilder().setCustomId('pseudos_prev').setLabel('⬅️ Précédent').setStyle(ButtonStyle.Primary).setDisabled(page <= 0)
  const search = new ButtonBuilder().setCustomId('pseudos_search').setLabel('🔎 Rechercher').setStyle(ButtonStyle.Secondary)
  const next = new ButtonBuilder().setCustomId('pseudos_next').setLabel('Suivant ➡️').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1)

  const row = new ActionRowBuilder().addComponents(prev, search, next)

  return { embeds: [embed], components: [row], page, totalPages }
}

async function readLocalMessageState() {
  try {
    if (fs.existsSync(MESSAGE_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGE_STATE_FILE, 'utf8') || '{}')
    }
  } catch (_) {
    // ignore
  }
  return {}
}

async function writeLocalMessageState(obj: any) {
  try {
    fs.writeFileSync(MESSAGE_STATE_FILE, JSON.stringify(obj, null, 2))
  } catch (_) {
    // ignore
  }
}

export async function updateGlobalMessage(client: Client) {
  try {
    let pseudos: any[] = []
    let msgRow: any = null
    let useDb = true

    try {
      pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
      msgRow = await prisma.messageState.findFirst()
    } catch (err) {
      useDb = false
      pseudos = await getPseudos()
      msgRow = await readLocalMessageState()
    }

    const messageId = msgRow?.messageId
    const storedChannelId = msgRow?.channelId
    const preferredChannelId = process.env.CHANNEL_ID || storedChannelId
    const currentPage = typeof msgRow?.page === 'number' ? msgRow.page : 0

    const payload = buildPseudosPage(pseudos, currentPage)

    // try éditer le message existant (préférer channel sauvegardé)
    if (messageId) {
      if (storedChannelId) {
        try {
          const ch = await client.channels.fetch(storedChannelId).catch(() => null)
          if (ch && typeof (ch as any).messages?.fetch === 'function') {
            const msg = await (ch as any).messages.fetch(messageId).catch(() => null)
            if (msg) {
              await msg.edit({ embeds: payload.embeds, components: payload.components })
              if (useDb && msgRow?.id) await prisma.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } })
              else await writeLocalMessageState({ ...(msgRow || {}), page: payload.page })
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
            await msg.edit({ embeds: payload.embeds, components: payload.components })
            if (useDb && msgRow?.id) {
              await prisma.messageState.update({ where: { id: msgRow.id }, data: { channelId: (channel as any).id, page: payload.page } })
            } else {
              await writeLocalMessageState({ messageId: msg.id, channelId: (channel as any).id, page: payload.page })
            }
            return
          }
        } catch (err) {
          // ignore
        }
      }
    }

    // créer un nouveau message si nécessaire
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

    const newMsg = await targetChannel.send({ embeds: payload.embeds, components: payload.components })
    if (useDb) {
      if (msgRow?.id) {
        await prisma.messageState.update({ where: { id: msgRow.id }, data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } })
      } else {
        await prisma.messageState.create({ data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } })
      }
    } else {
      await writeLocalMessageState({ messageId: newMsg.id, channelId: targetChannel.id, page: payload.page })
    }
  } catch (err) {
    console.error('updateGlobalMessage error:', err)
  }
}
