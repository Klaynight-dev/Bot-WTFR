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

  const embed = makeEmbed({ title: 'Pseudos modifiés', description: `Tes pseudos ont été mis à jour.`, color: 0x00AA00, fields: [{ name: 'Affichage', value: affichage }, { name: 'Roblox', value: roblox }] })
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ embeds: [embed], ephemeral: true })
    } else {
      await interaction.followUp({ embeds: [embed], ephemeral: true })
    }
  } catch (err) {
    console.error('interaction reply failed:', err)
  }

  updateGlobalMessage(client)
}
