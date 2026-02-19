import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import fs from 'fs'

const WARN_FILE = './warnings.json'

export const data = new SlashCommandBuilder()
  .setName('warns')
  .setDescription("Afficher les avertissements d'un utilisateur")
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur (si omis, affichera les warnings de la personne ciblée)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur') || interaction.user
  const warnings = fs.existsSync(WARN_FILE) ? JSON.parse(fs.readFileSync(WARN_FILE, 'utf8') || '[]') : []
  const userWarnings = warnings.filter((w: any) => w.id === user.id)

  if (userWarnings.length === 0) return interaction.reply({ content: 'Aucun avertissement pour cet utilisateur.', ephemeral: true })

  const embed = new EmbedBuilder()
    .setTitle(`Avertissements — ${user.tag}`)
    .setDescription(userWarnings.map((w: any, i: number) => `**${i + 1}.** ${w.reason} — <@${w.moderator}> (${new Date(w.date).toLocaleString()})`).join('\n'))
    .setColor(0xFFA500)

  await interaction.reply({ embeds: [embed], ephemeral: true })
}
