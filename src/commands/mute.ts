import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mettre un membre en timeout (mute)')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à mute').setRequired(true))
  .addIntegerOption(opt => opt.setName('minutes').setDescription('Durée en minutes (défaut 10)').setRequired(false))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .addBooleanOption(opt => opt.setName('secret').setDescription('Envoyer en privé (oui)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const minutes = interaction.options.getInteger('minutes') || 10
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'
  const secret = interaction.options.getBoolean('secret') ?? false
  console.log(`[cmd:mute] /mute by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} minutes=${minutes} reason=${reason} secret=${secret}`)

  if (!interaction.guild) return replyEphemeralEmbed(interaction, createErrorEmbed('Commande utilisable uniquement en serveur.'))

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return replyEphemeralEmbed(interaction, createErrorEmbed('Membre introuvable.'))

  // validation durée (Discord limite : 1 minute -> 28 jours)
  const maxMinutes = 28 * 24 * 60
  if (minutes <= 0 || minutes > maxMinutes) return replyEphemeralEmbed(interaction, createErrorEmbed(`Durée invalide. Entre 1 et ${maxMinutes} minutes (28 jours).`))

  // verification permissions et hiérarchie
  const botMember = interaction.guild.members.me
  if (!botMember || !botMember.permissions.has('ModerateMembers')) return replyEphemeralEmbed(interaction, createErrorEmbed(`Le bot n'a pas la permission "MODERATE_MEMBERS".`))

  // cannot moderate guild owner
  if (member.id === interaction.guild.ownerId) return replyEphemeralEmbed(interaction, createErrorEmbed(`Impossible de mute le propriétaire du serveur.`))

  // role hierarchy: bot must be higher than target
  if ((botMember.roles.highest.position) <= (member.roles.highest.position)) return replyEphemeralEmbed(interaction, createErrorEmbed(`Le rôle du membre est égal ou supérieur à celui du bot.`))

  // moderator (invoker) must be higher than target unless invoker is guild owner
  const invoker = interaction.member
  try {
    const invokerPos = (invoker as any)?.roles?.highest?.position ?? 0
    const targetPos = member.roles.highest.position
    if ((interaction.guild.ownerId !== (interaction.user.id)) && invokerPos <= targetPos) {
      return replyEphemeralEmbed(interaction, createErrorEmbed(`Tu ne peux pas mute un membre avec un rôle égal ou supérieur au tien.`))
    }
  } catch (_) {
    // ignore if can't determine
  }

  try {
    await member.timeout(minutes * 60 * 1000, reason)
    const embed = createEmbed({
      title: `${Emojis.Warning} Timeout appliqué`,
      description: `<@${user.id}> a été mis en timeout pour ${minutes} minute(s).`,
      color: Colors.Warning,
      fields: [
        { name: 'Raison', value: reason },
        { name: 'Modérateur', value: `<@${interaction.user.id}>` }
      ],
      footer: 'Sanction'
    })
    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err: any) {
    console.error('mute error:', err)
    const apiMsg = err?.message || String(err)
    return replyEphemeralEmbed(interaction, createErrorEmbed(`Impossible de placer en timeout. ${apiMsg}`))
  }
}
