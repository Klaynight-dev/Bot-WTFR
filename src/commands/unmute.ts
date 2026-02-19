import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('unmute')
  .setDescription('Retirer le timeout (unmute) d\'un membre')
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à unmute').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  console.log(`[cmd:unmute] /unmute by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id}`)

  if (!interaction.guild) return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', flags: MessageFlags.Ephemeral })

  const member = await interaction.guild.members.fetch(user.id).catch(() => null)
  if (!member) return interaction.reply({ content: 'Membre introuvable.', flags: MessageFlags.Ephemeral })

  try {
    await (member as any).timeout(null)
    await interaction.reply({ content: `✅ Timeout retiré pour ${user.tag}.`, flags: MessageFlags.Ephemeral })
  } catch (err) {
    console.error(err)
    await interaction.reply({ content: '❌ Impossible de retirer le timeout.', flags: MessageFlags.Ephemeral })
  }
}
