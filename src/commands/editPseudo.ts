import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import prisma from '../prisma'
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
  console.log(`[cmd:editpseudo] /editpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} affichage=${affichage} roblox=${roblox}`)

  const existing = await prisma.pseudo.findUnique({ where: { id: user.id } })

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

  await prisma.pseudo.update({ where: { id: user.id }, data: { display: affichage, roblox } })

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

  updateGlobalMessage(client)
}
