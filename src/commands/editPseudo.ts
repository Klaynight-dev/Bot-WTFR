import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import fs from 'fs'
import { updateGlobalMessage } from '../functions/updateMessage'

export const data = new SlashCommandBuilder()
  .setName('editpseudo')
  .setDescription('Modifier ses pseudos')
  .addStringOption(option => option.setName('affichage').setDescription("Nouveau pseudo d'affichage").setRequired(true))
  .addStringOption(option => option.setName('roblox').setDescription('Nouveau pseudo Roblox').setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  const affichage = interaction.options.getString('affichage') as string
  const roblox = interaction.options.getString('roblox') as string
  const user = interaction.user

  const data = JSON.parse(fs.readFileSync('./pseudos.json', 'utf8') || '[]') as any[]

  const existing = data.find(u => u.id === user.id)

  if (!existing) {
    const errOpts = { content: "❌ Tu n’as pas enregistré de pseudo.", ephemeral: true }
    try {
      if (!interaction.deferred && !interaction.replied) {
        return await interaction.reply(errOpts)
      } else {
        return await interaction.followUp(errOpts)
      }
    } catch (err) {
      console.error('interaction reply failed:', err)
      return
    }
  }

  existing.display = affichage
  existing.roblox = roblox

  const replyOptions = { content: '✅ Pseudos modifiés !', ephemeral: true }
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
    try { if (interaction.replied || interaction.deferred) await interaction.followUp({ content: "❌ Erreur lors de l'écriture.", ephemeral: true }) } catch (_) {}
    return
  }

  updateGlobalMessage(client)
}
