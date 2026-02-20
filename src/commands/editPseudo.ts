import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import prisma from '../prisma'
import { updateGlobalMessage } from '../functions/updateMessage'
import { replyEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, createSuccessEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('editpseudo')
  .setDescription('Modifier ses pseudos')
  .addStringOption(option => option.setName('affichage').setDescription("Nouveau pseudo d'affichage").setRequired(true))
  .addStringOption(option => option.setName('roblox').setDescription('Nouveau pseudo Roblox').setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  const affichage = interaction.options.getString('affichage') as string
  const roblox = interaction.options.getString('roblox') as string

  const mentionRegex = /<@!?\d+>/
  if (mentionRegex.test(affichage) || mentionRegex.test(roblox)) {
    return await replyEmbed(interaction, createErrorEmbed("Les pseudos ne peuvent pas contenir de mentions Discord."), true)
  }

  const user = interaction.user
  console.log(`[cmd:editpseudo] /editpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} affichage=${affichage} roblox=${roblox}`)

  const existing = await prisma.pseudo.findUnique({ where: { id: user.id } })

  if (!existing) {
    try {
      return await replyEmbed(interaction, createErrorEmbed("Tu n’as pas enregistré de pseudo."), true)
    } catch (err) {
      console.error('interaction reply failed:', err)
      return
    }
  }

  await prisma.pseudo.update({ where: { id: user.id }, data: { display: affichage, roblox } })

  const embed = createEmbed({
    title: `${Emojis.Success} Pseudos modifiés`,
    description: `Tes pseudos ont été mis à jour.`,
    color: Colors.Success,
    fields: [
      { name: 'Affichage', value: affichage, inline: true },
      { name: 'Roblox', value: roblox, inline: true }
    ]
  })

  try {
    await replyEmbed(interaction, embed, true)
  } catch (err) {
    console.error('interaction reply failed:', err)
  }

  updateGlobalMessage(client)
}
