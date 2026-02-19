import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import { makeEmbed, replyEmbed } from '../functions/respond'
import pkg from '../../package.json'

function formatUptime(ms = 0) {
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  const parts = []
  if (days) parts.push(`${days}d`)
  if (hours || days) parts.push(`${hours}h`)
  if (mins || hours || days) parts.push(`${mins}m`)
  parts.push(`${secs}s`)
  return parts.join(' ')
}

export const data = new SlashCommandBuilder().setName('info').setDescription('Informations sur le bot')

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  console.log(`[cmd:info] /info by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)

  const embed = makeEmbed({
    title: 'Informations du bot',
    fields: [
      { name: 'Version', value: `v${pkg.version}` },
      { name: 'Uptime', value: formatUptime((client as any).uptime ?? 0), inline: true },
      { name: 'Serveurs', value: `${(client as any).guilds?.cache?.size ?? 0}`, inline: true },
      { name: 'Commandes', value: `${(client as any).commands?.size ?? 0}`, inline: true }
    ]
  })

  await replyEmbed(interaction, embed)
}
