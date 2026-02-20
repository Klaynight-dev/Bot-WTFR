import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Expulser un membre')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .addBooleanOption(opt => opt.setName('secret').setDescription('Envoyer en privé (oui)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'
  console.log(`[cmd:kick] /kick by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} reason=${reason}`)

  const secret = interaction.options.getBoolean('secret') ?? false
  if (!interaction.guild) return replyEphemeralEmbed(interaction, createErrorEmbed('Commande utilisable uniquement en serveur.'))

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return replyEphemeralEmbed(interaction, createErrorEmbed('Membre introuvable.'))

  try {
    await member.kick(reason)

    const embed = createEmbed({
      title: `${Emojis.Warning} Expulsion`, // Orange for kick
      description: `<@${user.id}> a été expulsé.`,
      color: Colors.Warning,
      fields: [
        { name: 'Raison', value: reason },
        { name: 'Modérateur', value: `<@${interaction.user.id}>` }
      ],
      footer: 'Sanction'
    })

    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err) {
    console.error(err)
    return replyEphemeralEmbed(interaction, createErrorEmbed('Impossible d\'expulser ce membre (permissions insuffisantes ou rôle le plus élevé).'))
  }
}
