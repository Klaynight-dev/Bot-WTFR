import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import prisma from '../prisma'
import { makeEmbed, sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'

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

  const embed = makeEmbed({
    title: 'Avertissement',
    description: `<@${user.id}> a reçu un avertissement.`,
    color: 0xFFA500,
    fields: [
      { name: 'Raison', value: reason || 'Aucune raison fournie' },
      { name: 'Modérateur', value: `<@${interaction.user.id}>` }
    ]
  })

  await sendPublicOrSecret(interaction, embed, secret)
}
