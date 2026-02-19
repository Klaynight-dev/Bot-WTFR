import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { makeEmbed, sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bannir un membre')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .addBooleanOption(opt => opt.setName('secret').setDescription('Envoyer en privé (oui)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'
  console.log(`[cmd:ban] /ban by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} reason=${reason}`)

  const secret = interaction.options.getBoolean('secret') ?? false
  if (!interaction.guild) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Commande utilisable uniquement en serveur.', color: 0xFF0000 }))

  try {
    // use guild ban via members manager
    await (interaction.guild.members as any).ban(user.id, { reason })
    const embed = makeEmbed({ title: 'Bannissement', description: `<@${user.id}> banni.`, color: 0xFF0000, fields: [{ name: 'Raison', value: reason }, { name: 'Modérateur', value: `<@${interaction.user.id}>` }] })
    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err) {
    console.error(err)
    return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Impossible de bannir ce membre.', color: 0xFF0000 }))
  }
}
