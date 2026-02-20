import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('tempban')
  .setDescription('Bannir temporairement un membre (ne survive pas au redémarrage)')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
  .addIntegerOption(opt => opt.setName('minutes').setDescription('Durée en minutes').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .addBooleanOption(opt => opt.setName('secret').setDescription('Envoyer en privé (oui)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const minutes = interaction.options.getInteger('minutes', true)
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'
  console.log(`[cmd:tempban] /tempban by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} minutes=${minutes} reason=${reason}`)

  const secret = interaction.options.getBoolean('secret') ?? false
  if (!interaction.guild) return replyEphemeralEmbed(interaction, createErrorEmbed('Commande utilisable uniquement en serveur.'))

  try {
    await (interaction.guild.members as any).ban(user.id, { reason })

    const embed = createEmbed({
      title: `${Emojis.Warning} Bannissement temporaire`,
      description: `<@${user.id}> banni pour ${minutes} minute(s).`,
      color: Colors.Warning, // Orange because temp
      fields: [
        { name: 'Raison', value: reason },
        { name: 'Modérateur', value: `<@${interaction.user.id}>` }
      ],
      footer: 'Sanction temporaire'
    })

    await sendPublicOrSecret(interaction, embed, secret)

    const ms = minutes * 60 * 1000
    setTimeout(async () => {
      try {
        await (interaction.guild as any).members.unban(user.id)
        console.log(`Tempban retiré pour ${user.id}`)
      } catch (err) {
        console.error('failed to unban (tempban):', err)
      }
    }, ms)
  } catch (err) {
    console.error(err)
    return replyEphemeralEmbed(interaction, createErrorEmbed('Impossible de bannir ce membre.'))
  }
}
