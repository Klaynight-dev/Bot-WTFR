require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

client.once('clientReady', () => {
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

      // Pagination
      if (id === 'pseudos_prev' || id === 'pseudos_next') {
        const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
        const msgData = (await prisma.messageState.findFirst()) || {}
        const perPage = 5
        const totalPages = Math.max(1, Math.ceil(pseudos.length / perPage))
        let page = typeof msgData.page === 'number' ? msgData.page : 0

        page = id === 'pseudos_next' ? Math.min(totalPages - 1, page + 1) : Math.max(0, page - 1)

        const payload = buildPseudosPage(pseudos, page, perPage)

        if (msgData?.id) {
          await prisma.messageState.update({ where: { id: msgData.id }, data: { page: payload.page } })
        } else {
          await prisma.messageState.create({ data: { page: payload.page } })
        }

        await interaction.update({ embeds: payload.embeds, components: payload.components })
        return
      }

      // Goto from search results
      if (id.startsWith('pseudos_goto_')) {
        const targetId = id.replace('pseudos_goto_', '')
        const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
        const idx = pseudos.findIndex(u => u.id === targetId)
        if (idx === -1) {
          await interaction.reply({ content: 'Utilisateur introuvable dans la liste.', flags: 64 })
          return
        }

        const perPage = 5
        const page = Math.floor(idx / perPage)
        const payload = buildPseudosPage(pseudos, page, perPage)

        // edit public message
        const msgData = (await prisma.messageState.findFirst()) || {}
        if (msgData.channelId && msgData.messageId) {
          try {
            const ch = await client.channels.fetch(msgData.channelId).catch(() => null)
            if (ch) {
              const msg = await ch.messages.fetch(msgData.messageId).catch(() => null)
              if (msg) {
                await msg.edit({ embeds: payload.embeds, components: payload.components })
                if (msgData?.id) await prisma.messageState.update({ where: { id: msgData.id }, data: { page: payload.page } })
              }
            }
          } catch (err) {
            console.error(err)
          }
        }

        await interaction.reply({ content: '✅ Affiché dans le listing public.', flags: 64 })
        return
      }

      // Open search modal
      if (id === 'pseudos_search') {
        const modal = new ModalBuilder().setCustomId('pseudos_modal_search').setTitle('Rechercher un pseudo')
        const input = new TextInputBuilder().setCustomId('query').setLabel('Discord / affichage / roblox').setStyle(TextInputStyle.Short).setRequired(true)
        modal.addComponents(new ActionRowBuilder().addComponents(input))
        await interaction.showModal(modal)
        return
      }
    }

    // Modal submit (search)
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'pseudos_modal_search') {
        const q = interaction.fields.getTextInputValue('query').trim()
        const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
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
