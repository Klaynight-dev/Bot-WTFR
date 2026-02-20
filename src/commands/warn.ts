import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import prisma from '../prisma'
import { sendPublicOrSecret } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription("Ajouter un avertissement à un utilisateur")
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true))
  .addBooleanOption(opt => opt.setName('secret').setDescription("Envoyer en privé (oui)").setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison', true)
  const secret = interaction.options.getBoolean('secret') ?? false
  console.log(`[cmd:warn] /warn by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} reason=${reason} secret=${secret}`)
  await prisma.warning.create({ data: { userId: user.id, moderatorId: interaction.user.id, reason } })

  const embed = createEmbed({
    title: `⚠️ Avertissement`,
    description: `Un utilisateur a reçu un avertissement.`,
    color: Colors.Warning,
    fields: [
      { name: '👤 Utilisateur', value: `<@${user.id}>`, inline: true },
      { name: '🛡️ Modérateur', value: `<@${interaction.user.id}>`, inline: true },
      { name: '📄 Raison', value: `\`\`\`${reason || 'Aucune raison fournie'}\`\`\`` }
    ],
    footer: `Warn ID: ${Date.now().toString(36).toUpperCase()}`
  })

  await sendPublicOrSecret(interaction, embed, secret)
}
