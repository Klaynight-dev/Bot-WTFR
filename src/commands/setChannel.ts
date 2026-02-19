import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { updateGlobalMessage } from '../functions/updateMessage'

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription("Définir le salon où poster l'embed public")
  .addChannelOption(opt => opt.setName('channel').setDescription('Salon texte').setRequired(true).addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

export async function execute(interaction: ChatInputCommandInteraction, client: any) {
  const channel = interaction.options.getChannel('channel', true)
  const file = path.join(process.cwd(), 'messageId.json')
  let msgData: any = {}
  try {
    if (fs.existsSync(file)) msgData = JSON.parse(fs.readFileSync(file, 'utf8') || '{}')
  } catch (err) { /* ignore */ }

  msgData.channelId = channel.id
  // force rebuild of public message
  delete msgData.messageId
  msgData.page = 0
  fs.writeFileSync(file, JSON.stringify(msgData, null, 2))

  try {
    await updateGlobalMessage(client)
    await interaction.reply({ content: `✅ Salon de listing défini sur <#${channel.id}>.`, ephemeral: true })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: "❌ Erreur lors de la mise à jour du message public.", ephemeral: true })
  }
}
