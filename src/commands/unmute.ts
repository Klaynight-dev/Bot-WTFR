import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { makeEmbed, sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'

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

  if (!interaction.guild) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Commande utilisable uniquement en serveur.', color: 0xFF0000 }))

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Membre introuvable.', color: 0xFF0000 }))

  try {
    await (member as any).timeout(null)
    const embed = makeEmbed({ title: 'Timeout retiré', description: `<@${user.id}> n'est plus en timeout.`, color: 0x00AA00, fields: [{ name: 'Modérateur', value: `<@${interaction.user.id}>` }] })
    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err) {
    console.error(err)
    return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Impossible de retirer le timeout.', color: 0xFF0000 }))
  }
}
