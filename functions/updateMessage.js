const fs = require('fs')

/**
 * Met à jour le message global affichant les pseudos enregistrés
 * @param {import('discord.js').Client} client
 * @returns {Promise<void>}
 */
async function updateGlobalMessage(client) {
  try {
    const pseudos = JSON.parse(fs.readFileSync('./pseudos.json', 'utf8'))
    const msgData = JSON.parse(fs.readFileSync('./messageId.json', 'utf8'))
    const messageId = msgData && msgData.messageId

    const buildContent = () => {
      if (!Array.isArray(pseudos) || pseudos.length === 0) return '**Pseudos enregistrés — WTFR**\n\n_Aucun pseudo enregistré._'
      let out = '**Pseudos enregistrés — WTFR**\n\n'
      for (const u of pseudos) {
        out += `• <@${u.id}> — \`${u.display}\` (Roblox: \`${u.roblox}\`)\n`
      }
      return out
    }

    const content = buildContent()

    if (messageId) {
      for (const channel of client.channels.cache.values()) {
        if (typeof channel.messages?.fetch !== 'function') continue
        try {
          const msg = await channel.messages.fetch(messageId).catch(() => null)
          if (msg) {
            await msg.edit({ content })
            return
          }
        } catch (err) {
          // ignore
        }
      }
    }

    const guild = client.guilds.cache.first()
    if (!guild) return

    const targetChannel = guild.channels.cache.find(ch => ch.isTextBased && ch.permissionsFor(guild.members.me).has('SendMessages'))
    if (!targetChannel) return

    const newMsg = await targetChannel.send(content)
    msgData.messageId = newMsg.id
    fs.writeFileSync('./messageId.json', JSON.stringify(msgData, null, 2))
  } catch (err) {
    console.error('updateGlobalMessage error:', err)
  }
}

module.exports = { updateGlobalMessage }
