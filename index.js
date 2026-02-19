require('dotenv').config()

const {
  Client,
  GatewayIntentBits,
  Collection,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js')
const fs = require('fs')
const { updateGlobalMessage, buildPseudosPage } = require('./functions/updateMessage')

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

client.commands = new Collection()

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.data.name, command)
}

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`)

  updateGlobalMessage(client)

  setInterval(() => {
    updateGlobalMessage(client)
  }, 14 * 24 * 60 * 60 * 1000)
})

client.on('interactionCreate', async interaction => {
  try {
    // Chat commands (existing)
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName)
      if (!command) return
      try {
        await command.execute(interaction, client)
      } catch (err) {
        console.error(err)
      }
      return
    }

    // Button interactions (pagination / search / goto)
    if (interaction.isButton()) {
      const id = interaction.customId

      // Pagination buttons removed from public listing — ignore legacy clicks
      if (id === 'pseudos_prev' || id === 'pseudos_next') {
        await interaction.reply({ content: 'Pagination désactivée pour le message public.', flags: 64 })
        return
      }

      // Goto from search results
      if (id.startsWith('pseudos_goto_')) {
        const targetId = id.replace('pseudos_goto_', '')
        const pseudos = JSON.parse(fs.readFileSync('./pseudos.json', 'utf8') || '[]')
        const idx = pseudos.findIndex(u => u.id === targetId)
        if (idx === -1) {
          await interaction.reply({ content: 'Utilisateur introuvable dans la liste.', flags: 64 })
          return
        }

        const perPage = 5
        const page = Math.floor(idx / perPage)
        const payload = buildPseudosPage(pseudos, page, perPage)

        // edit public message
        const msgData = JSON.parse(fs.readFileSync('./messageId.json', 'utf8') || '{}')
        if (msgData.channelId && msgData.messageId) {
          try {
            const ch = await client.channels.fetch(msgData.channelId).catch(() => null)
            if (ch) {
              const msg = await ch.messages.fetch(msgData.messageId).catch(() => null)
              if (msg) {
                await msg.edit({ embeds: payload.embeds })
                msgData.page = payload.page
                fs.writeFileSync('./messageId.json', JSON.stringify(msgData, null, 2))
              }
            }
          } catch (err) {
            console.error(err)
          }
        }

        await interaction.reply({ content: '✅ Affiché dans le listing public.', flags: 64 })
        return
      }

      // 'pseudos_search' button removed from public listing — modal is not reachable from that message
      if (id === 'pseudos_search') {
        await interaction.reply({ content: 'Recherche désactivée depuis le message public.', flags: 64 })
        return
      }
    }

    // Modal submit (search)
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'pseudos_modal_search') {
        const q = interaction.fields.getTextInputValue('query').trim()
        const pseudos = JSON.parse(fs.readFileSync('./pseudos.json', 'utf8') || '[]')
        const matches = []

        const mentionMatch = q.match(/^<@!?(\d+)>$/) || q.match(/^(\d+)$/)
        if (mentionMatch) {
          const id = mentionMatch[1]
          matches.push(...pseudos.filter(u => u.id === id))
        } else {
          const lower = q.toLowerCase()
          matches.push(...pseudos.filter(u => (u.display || '').toLowerCase().includes(lower) || (u.roblox || '').toLowerCase().includes(lower)))
        }

        if (matches.length === 0) {
          await interaction.reply({ content: 'Aucun résultat.', flags: 64 })
          return
        }

        const embed = new EmbedBuilder().setTitle(`Résultats pour "${q}"`).setColor(0x5865F2)
          .setDescription(matches.map(u => `• <@${u.id}> — \`${u.display}\` • Roblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`).join('\n'))
          .setFooter({ text: `${matches.length} résultat(s)` })

        const gotoRow = new ActionRowBuilder()
        const linkRow = new ActionRowBuilder()
        for (let i = 0; i < Math.min(matches.length, 5); i++) {
          gotoRow.addComponents(new ButtonBuilder().setCustomId(`pseudos_goto_${matches[i].id}`).setLabel(`Voir #${i + 1}`).setStyle(ButtonStyle.Primary))
          linkRow.addComponents(new ButtonBuilder().setLabel(`Profil Roblox #${i + 1}`).setStyle(ButtonStyle.Link).setURL(`https://www.roblox.com/users/profile?username=${encodeURIComponent(matches[i].roblox)}`))
        }

        const components = []
        if (gotoRow.components.length) components.push(gotoRow)
        if (linkRow.components.length) components.push(linkRow)

        await interaction.reply({ embeds: [embed], components, flags: 64 })
        return
      }
    }
  } catch (err) {
    console.error('interaction handler error:', err)
  }
})

client.login(process.env.TOKEN)
