import { SlashCommandBuilder, ChatInputCommandInteraction, Client, MessageFlags } from 'discord.js'
import prisma from '../prisma'
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
  console.log(`[cmd:setpseudo] /setpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} affichage=${affichage} roblox=${roblox}`)

  try {
    await prisma.pseudo.upsert({
      where: { id: user.id },
      update: { display: affichage, roblox },
      create: { id: user.id, display: affichage, roblox }
    })
  } catch (err) {
    console.error('prisma upsert pseudo failed:', err)
    try { await interaction.reply({ content: "❌ Erreur lors de l'enregistrement.", flags: MessageFlags.Ephemeral }) } catch (_) {}
    return
  }

  const replyOptions = { content: '✅ Pseudo enregistré !', flags: MessageFlags.Ephemeral }
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
