import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import { makeEmbed, replyEphemeralEmbed } from '../functions/respond'

export const data = new SlashCommandBuilder().setName('ping').setDescription('Retourne la latence du bot')

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  console.log(`[cmd:ping] /ping by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  const apiLatency = Math.round((client as any).ws?.ping ?? 0)
  const roundtrip = Date.now() - interaction.createdTimestamp

  const embed = makeEmbed({
    title: 'Pong! 🏓',
    fields: [
      { name: 'API', value: `${apiLatency} ms`, inline: true },
      { name: 'Réponse', value: `${roundtrip} ms`, inline: true }
    ]
  })

  await replyEphemeralEmbed(interaction, embed)
}
