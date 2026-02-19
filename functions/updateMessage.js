const fs = require('fs')
const { EmbedBuilder } = require('discord.js')

/**
 * Génère un embed paginé (sans composants) pour le message public
 * @param {Array} pseudos
 * @param {number} page
 * @param {number} perPage
 * @returns {{embeds: Array, page: number, totalPages: number}}
 */
function buildPseudosPage(pseudos = [], page = 0, perPage = 5) {
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

  // Public listing: retourne uniquement l'embed (pas de composants)
  return { embeds: [embed], page, totalPages }
}

/**
 * Met à jour le message global affichant les pseudos (utilise l'embed paginé)
 * Priorise le salon défini par `process.env.CHANNEL_ID` et sauvegarde `channelId` + `page`.
 * @param {import('discord.js').Client} client
 */
async function updateGlobalMessage(client) {
  try {
    const pseudos = JSON.parse(fs.readFileSync('./pseudos.json', 'utf8'))
    const msgData = JSON.parse(fs.readFileSync('./messageId.json', 'utf8')) || {}
    const messageId = msgData && msgData.messageId
    const storedChannelId = msgData && msgData.channelId
    const preferredChannelId = process.env.CHANNEL_ID || storedChannelId
    const currentPage = typeof msgData.page === 'number' ? msgData.page : 0

    const payload = buildPseudosPage(pseudos, currentPage)

    // try éditer le message existant (préférer channel sauvegardé)
    if (messageId) {
      if (storedChannelId) {
        try {
          const ch = await client.channels.fetch(storedChannelId).catch(() => null)
          if (ch && typeof ch.messages?.fetch === 'function') {
            const msg = await ch.messages.fetch(messageId).catch(() => null)
            if (msg) {
              await msg.edit({ embeds: payload.embeds })
              msgData.page = payload.page
              fs.writeFileSync('./messageId.json', JSON.stringify(msgData, null, 2))
              return
            }
          }
        } catch (err) {
          // ignore
        }
      }

      for (const channel of client.channels.cache.values()) {
        if (typeof channel.messages?.fetch !== 'function') continue
        try {
          const msg = await channel.messages.fetch(messageId).catch(() => null)
          if (msg) {
            await msg.edit({ embeds: payload.embeds })
            msgData.channelId = channel.id
            msgData.page = payload.page
            fs.writeFileSync('./messageId.json', JSON.stringify(msgData, null, 2))
            return
          }
        } catch (err) {
          // ignore
        }
      }
    }

    // créer un nouveau message si nécessaire
    let targetChannel = null
    if (preferredChannelId) {
      try {
        const ch = await client.channels.fetch(preferredChannelId).catch(() => null)
        if (ch && ch.isTextBased && ch.permissionsFor?.(ch.guild?.members?.me).has('SendMessages')) {
          targetChannel = ch
        }
      } catch (err) {
        // ignore
      }
    }

    if (!targetChannel) {
      const guild = client.guilds.cache.first()
      if (!guild) return
      targetChannel = guild.channels.cache.find(ch => ch.isTextBased && ch.permissionsFor(guild.members.me).has('SendMessages'))
      if (!targetChannel) return
    }

    const newMsg = await targetChannel.send({ embeds: payload.embeds })
    msgData.messageId = newMsg.id
    msgData.channelId = targetChannel.id
    msgData.page = payload.page
    fs.writeFileSync('./messageId.json', JSON.stringify(msgData, null, 2))
  } catch (err) {
    console.error('updateGlobalMessage error:', err)
  }
}

module.exports = { updateGlobalMessage, buildPseudosPage }
