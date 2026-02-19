import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js'
import { makeEmbed, sendPublicOrSecret, replyEphemeralEmbed } from '../functions/respond'

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

  if (!interaction.guild) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Commande utilisable uniquement en serveur.', color: 0xFF0000 }))

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur', description: 'Membre introuvable.', color: 0xFF0000 }))

  // validation durée (Discord limite : 1 minute -> 28 jours)
  const maxMinutes = 28 * 24 * 60
  if (minutes <= 0 || minutes > maxMinutes) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Durée invalide', description: `Entre 1 et ${maxMinutes} minutes (28 jours).`, color: 0xFF0000 }))

  // verification permissions et hiérarchie
  const botMember = interaction.guild.members.me
  if (!botMember || !botMember.permissions.has?.('ModerateMembers')) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Permissions manquantes', description: `Le bot n'a pas la permission "MODERATE_MEMBERS".`, color: 0xFF0000 }))

  // cannot moderate guild owner
  if (member.id === interaction.guild.ownerId) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Impossible', description: `Impossible de mute le propriétaire du serveur.`, color: 0xFF0000 }))

  // role hierarchy: bot must be higher than target
  if ((botMember.roles?.highest?.position ?? 0) <= (member.roles?.highest?.position ?? 0)) return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Impossible', description: `Le rôle du membre est égal ou supérieur à celui du bot.`, color: 0xFF0000 }))

  // moderator (invoker) must be higher than target unless invoker is guild owner
  const invoker = interaction.member
  try {
    const invokerPos = (invoker as any)?.roles?.highest?.position ?? 0
    const targetPos = member.roles?.highest?.position ?? 0
    if ((interaction.guild.ownerId !== (interaction.user.id)) && invokerPos <= targetPos) {
      return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Impossible', description: `Tu ne peux pas mute un membre avec un rôle égal ou supérieur au tien.`, color: 0xFF0000 }))
    }
  } catch (_) {
    // ignore if can't determine
  }

  try {
    await (member as any).timeout(minutes * 60 * 1000, reason)
    const embed = makeEmbed({
      title: 'Timeout appliqué',
      description: `<@${user.id}> mis en timeout (${minutes} minute(s)).`,
      color: 0xFFA500,
      fields: [
        { name: 'Raison', value: reason },
        { name: 'Modérateur', value: `<@${interaction.user.id}>` }
      ]
    })
    await sendPublicOrSecret(interaction, embed, secret)
  } catch (err: any) {
    console.error('mute error:', err)
    const apiMsg = err?.message || String(err)
    return replyEphemeralEmbed(interaction, makeEmbed({ title: 'Erreur API', description: `Impossible de placer en timeout. ${apiMsg}`, color: 0xFF0000 }))
  }
}
