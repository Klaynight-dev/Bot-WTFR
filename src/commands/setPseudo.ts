import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import fs from 'fs'
import { updateGlobalMessage } from '../functions/updateMessage'

export const data = new SlashCommandBuilder()
  .setName('setpseudo')
  .setDescription('Définir ses pseudos')
  .addStringOption(option =>
    option.setName('affichage').setDescription("Pseudo d'affichage WTFR").setRequired(true)
  )
  .addStringOption(option =>
    option.setName('roblox').setDescription('Pseudo Roblox').setRequired(true)
  )

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  const affichage = interaction.options.getString('affichage') as string
  const roblox = interaction.options.getString('roblox') as string
  const user = interaction.user

  const data = JSON.parse(fs.readFileSync('./pseudos.json', 'utf8') || '[]') as any[]

  const existing = data.find(u => u.id === user.id)

  if (existing) {
    existing.display = affichage
    existing.roblox = roblox
  } else {
    data.push({ id: user.id, display: affichage, roblox })
  }

  const replyOptions = { content: '✅ Pseudo enregistré !', ephemeral: true }
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply(replyOptions)
    } else {
      await interaction.followUp(replyOptions)
    }
  } catch (err) {
    console.error('interaction reply failed:', err)
  }

  try {
    fs.writeFileSync('./pseudos.json', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('failed to write pseudos.json:', err)
    try { if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "❌ Erreur lors de l'enregistrement.", ephemeral: true }) } catch (_) {}
    return
  }

  updateGlobalMessage(client)
}
