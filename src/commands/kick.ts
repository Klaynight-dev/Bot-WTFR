import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { makeEmbed, sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'

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
  if (!interaction.guild) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Commande utilisable uniquement en serveur.', color: 0xFF0000 }))

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Membre introuvable.', color: 0xFF0000 }))

  try {
    await member.kick(reason)
    const embed = makeEmbed({ title: 'Expulsion', description: `<@${user.id}> expulsé.`, color: 0xFF4400, fields: [{ name: 'Raison', value: reason }, { name: 'Modérateur', value: `<@${interaction.user.id}>` }] })
    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err) {
    console.error(err)
    return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: `Impossible d'expulser ce membre.`, color: 0xFF0000 }))
  }
}
