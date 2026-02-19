import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mettre un membre en timeout (mute)')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à mute').setRequired(true))
  .addIntegerOption(opt => opt.setName('minutes').setDescription('Durée en minutes (défaut 10)').setRequired(false))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const minutes = interaction.options.getInteger('minutes') || 10
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie'

  if (!interaction.guild) return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', ephemeral: true })

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true })

  // validation durée (Discord limite : 1 minute -> 28 jours)
  const maxMinutes = 28 * 24 * 60
  if (minutes <= 0 || minutes > maxMinutes) {
    return interaction.reply({ content: `Durée invalide — entre 1 et ${maxMinutes} minutes (28 jours).`, ephemeral: true })
  }

  // verification permissions et hiérarchie
  const botMember = interaction.guild.members.me
  if (!botMember || !botMember.permissions.has?.('ModerateMembers')) {
    return interaction.reply({ content: "Le bot n'a pas la permission \"MODERATE_MEMBERS\".", ephemeral: true })
  }

  // cannot moderate guild owner
  if (member.id === interaction.guild.ownerId) {
    return interaction.reply({ content: "Impossible de mute le propriétaire du serveur.", ephemeral: true })
  }

  // role hierarchy: bot must be higher than target
  if ((botMember.roles?.highest?.position ?? 0) <= (member.roles?.highest?.position ?? 0)) {
    return interaction.reply({ content: "Impossible : le rôle du membre est égal ou supérieur à celui du bot.", ephemeral: true })
  }

  // moderator (invoker) must be higher than target unless invoker is guild owner
  const invoker = interaction.member
  try {
    const invokerPos = (invoker as any)?.roles?.highest?.position ?? 0
    const targetPos = member.roles?.highest?.position ?? 0
    if ((interaction.guild.ownerId !== (interaction.user.id)) && invokerPos <= targetPos) {
      return interaction.reply({ content: "Tu ne peux pas mute un membre avec un rôle égal ou supérieur au tien.", ephemeral: true })
    }
  } catch (_) {
    // ignore if can't determine
  }

  try {
    await (member as any).timeout(minutes * 60 * 1000, reason)
    await interaction.reply({ content: `✅ ${user.tag} mis en timeout (${minutes} min).`, ephemeral: true })
  } catch (err: any) {
    console.error('mute error:', err)
    const apiMsg = err?.message || String(err)
    await interaction.reply({ content: `❌ Impossible de placer en timeout. Erreur API: ${apiMsg}`, ephemeral: true })
  }
}
