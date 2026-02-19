import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import prisma from './prisma'
import {
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
} from 'discord.js'

import { updateGlobalMessage, buildPseudosPage } from './functions/updateMessage'

type ExtendedClient = Client & { commands: Collection<string, any> }
const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as ExtendedClient

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'))
  for (const file of commandFiles) {
    // dynamic require works with compiled (dist) JS and with ts-node
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command = require(path.join(commandsPath, file))
    client.commands.set(command.data.name, command)
  }
}

client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user?.tag}`)

})

client.on('interactionCreate', async (interaction: any) => {
  try {
    // Chat commands
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName)
      if (!command) return
      try {
        await command.execute(interaction, client)
      } catch (err) {
        console.error(err)
      }
      return
    }

    // Button interactions (legacy/public message buttons are mostly disabled now)
    if (interaction.isButton && interaction.isButton()) {
      const id = interaction.customId

      // Pagination (public message buttons)
      if (id === 'pseudos_prev' || id === 'pseudos_next') {
        const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
        const msgRow = await prisma.messageState.findFirst()
        const perPage = 5
        const totalPages = Math.max(1, Math.ceil(pseudos.length / perPage))
        let page = typeof msgRow?.page === 'number' ? msgRow.page : 0

        page = id === 'pseudos_next' ? Math.min(totalPages - 1, page + 1) : Math.max(0, page - 1)

        const payload = buildPseudosPage(pseudos, page, perPage)

        if (msgRow) {
          await prisma.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } })
        } else {
          await prisma.messageState.create({ data: { page: payload.page } })
        }

        await interaction.update({ embeds: payload.embeds, components: payload.components })
        return
      }

      // Goto from search results (still supported)
      if (id.startsWith('pseudos_goto_')) {
        const targetId = id.replace('pseudos_goto_', '')
        const pseudos = await prisma.pseudo.findMany({ orderBy: { createdAt: 'asc' } })
        const idx = pseudos.findIndex((u: any) => u.id === targetId)
        if (idx === -1) {
          await interaction.reply({ content: 'Utilisateur introuvable dans la liste.', ephemeral: true })
          return
        }

        const perPage = 5
        const page = Math.floor(idx / perPage)
        const payload = buildPseudosPage(pseudos, page, perPage)

        // edit public embed
        const msgRow = await prisma.messageState.findFirst()
        if (msgRow?.channelId && msgRow?.messageId) {
          try {
            const ch = await client.channels.fetch(msgRow.channelId).catch(() => null)
            if (ch) {
              const msg = await (ch as any).messages.fetch(msgRow.messageId).catch(() => null)
              if (msg) {
                await msg.edit({ embeds: payload.embeds, components: payload.components })
                await prisma.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } })
              }
            }
          } catch (err) {
            console.error(err)
          }
        }

        await interaction.reply({ content: '✅ Affiché dans le listing public.', ephemeral: true })
        return
      }

      // Open search modal
      if (id === 'pseudos_search') {
        const modal = new ModalBuilder().setCustomId('pseudos_modal_search').setTitle('Rechercher un pseudo')
        const input = new TextInputBuilder().setCustomId('query').setLabel('Discord / affichage / roblox').setStyle(TextInputStyle.Short).setRequired(true)
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input))
        await interaction.showModal(modal)
        return
      }
    }

    // Modal submit (search)
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      if (interaction.customId === 'pseudos_modal_search') {
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
          await interaction.reply({ content: 'Aucun résultat.', ephemeral: true })
          return
        }

        const embed = new EmbedBuilder()
          .setTitle(`Résultats pour "${q}"`)
          .setColor(0x5865F2)
          .setDescription(matches.map(u => `• <@${u.id}> — \`${u.display}\` • Roblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`).join('\n'))
          .setFooter({ text: `${matches.length} résultat(s)` })

        const gotoRow = new ActionRowBuilder()
        const linkRow = new ActionRowBuilder()
        for (let i = 0; i < Math.min(matches.length, 5); i++) {
          gotoRow.addComponents(new ButtonBuilder().setCustomId(`pseudos_goto_${matches[i].id}`).setLabel(`Voir #${i + 1}`).setStyle(ButtonStyle.Primary))
          linkRow.addComponents(new ButtonBuilder().setLabel(`Profil Roblox #${i + 1}`).setStyle(ButtonStyle.Link).setURL(`https://www.roblox.com/users/profile?username=${encodeURIComponent(matches[i].roblox)}`))
        }

        const components = [] as any[]
        if ((gotoRow as any).components.length) components.push(gotoRow)
        if ((linkRow as any).components.length) components.push(linkRow)

        await interaction.reply({ embeds: [embed], components, ephemeral: true })
        return
      }
    }
  } catch (err) {
    console.error('interaction handler error:', err)
  }
})

client.login(process.env.TOKEN)
