import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Retirer le timeout (unmute) d\'un membre')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à unmute').setRequired(true))
  .addBooleanOption(opt => opt.setName('secret').setDescription('Envoyer en privé (oui)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const secret = interaction.options.getBoolean('secret') ?? false
  console.log(`[cmd:unmute] /unmute by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} secret=${secret}`)

  if (!interaction.guild) return replyEphemeralEmbed(interaction, createErrorEmbed('Commande utilisable uniquement en serveur.'))

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return replyEphemeralEmbed(interaction, createErrorEmbed('Membre introuvable.'))

  try {
    await member.timeout(null)
    const embed = createEmbed({
      title: `${Emojis.Success} Timeout retiré`,
      description: `<@${user.id}> n'est plus en timeout.`,
      color: Colors.Success,
      fields: [{ name: 'Modérateur', value: `<@${interaction.user.id}>` }]
    })
    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err) {
    console.error(err)
    return replyEphemeralEmbed(interaction, createErrorEmbed('Impossible de retirer le timeout.'))
  }
}
