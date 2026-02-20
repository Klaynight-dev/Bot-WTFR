import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import { replyEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'
import pkg from '../../package.json'

function formatUptime(ms = 0) {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  const parts = []
  if (days) parts.push(`${days}j`)
  if (hours || days) parts.push(`${hours}h`)
  if (mins || hours || days) parts.push(`${mins}m`)
  parts.push(`${secs}s`)
  return parts.join(' ')
}

export const data = new SlashCommandBuilder().setName('info').setDescription('Informations sur le bot')

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  console.log(`[cmd:info] /info by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)

  const embed = createEmbed({
    title: `${Emojis.Info} Informations du bot`,
    color: Colors.Info,
    fields: [
      { name: 'Version', value: `v${pkg.version}`, inline: true },
      { name: 'Uptime', value: formatUptime(client.uptime ?? 0), inline: true },
      { name: 'Serveurs', value: `${client.guilds.cache.size}`, inline: true },
      { name: 'Utilisateurs', value: `${client.users.cache.size}`, inline: true },
      { name: 'Commandes', value: `${(client as any).commands?.size ?? 0}`, inline: true },
      { name: 'Ping', value: `${client.ws.ping}ms`, inline: true }
    ],
    thumbnail: client.user?.displayAvatarURL()
  })

  await replyEmbed(interaction, embed)
}
