import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder().setName('ping').setDescription('Retourne la latence du bot')

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  console.log(`[cmd:ping] /ping by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  const apiLatency = Math.round((client as any).ws?.ping ?? 0)
  const roundtrip = Date.now() - interaction.createdTimestamp

  let color = Colors.Success
  if (apiLatency > 200) color = Colors.Warning
  if (apiLatency > 500) color = Colors.Error

  const embed = createEmbed({
    title: '🏓 Pong !',
    color: color,
    fields: [
      { name: '📡 Latence API', value: `\`${apiLatency} ms\``, inline: true },
      { name: '⚡ Latence Bot', value: `\`${roundtrip} ms\``, inline: true }
    ],
    footer: 'WarBot FR System'
  })

  await replyEphemeralEmbed(interaction, embed)
}
