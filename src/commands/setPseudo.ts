import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import prisma from '../prisma'
import { updateGlobalMessage } from '../functions/updateMessage'
import { replyEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, createSuccessEmbed, Colors, Emojis } from '../utils/style'

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
  console.log(`[cmd:setpseudo] /setpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} affichage=${affichage} roblox=${roblox}`)

  try {
    await prisma.pseudo.upsert({
      where: { id: user.id },
      update: { display: affichage, roblox },
      create: { id: user.id, display: affichage, roblox }
    })
  } catch (err) {
    console.error('prisma upsert pseudo failed:', err)
    try { await replyEmbed(interaction, createErrorEmbed("Erreur lors de l'enregistrement."), false) } catch (_) { }
    return
  }

  const embed = createEmbed({
    title: `${Emojis.Success} Pseudo enregistré`,
    description: `Ton pseudo WTFR a bien été enregistré.`,
    color: Colors.Success,
    fields: [
      { name: 'Affichage', value: affichage, inline: true },
      { name: 'Roblox', value: roblox, inline: true }
    ]
  })

  try {
    await replyEmbed(interaction, embed, false)
  } catch (err) {
    console.error('interaction reply failed:', err)
  }

  updateGlobalMessage(client)
}
