import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import fs from 'fs'

const WARN_FILE = './warnings.json'

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription("Ajouter un avertissement à un utilisateur")
  .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur').setRequired(true))
  .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('utilisateur', true)
  const reason = interaction.options.getString('raison', true)

  const warnings = fs.existsSync(WARN_FILE) ? JSON.parse(fs.readFileSync(WARN_FILE, 'utf8') || '[]') : []
  warnings.push({ id: user.id, moderator: interaction.user.id, reason, date: new Date().toISOString() })
  fs.writeFileSync(WARN_FILE, JSON.stringify(warnings, null, 2))

  await interaction.reply({ content: `⚠️ ${user.tag} averti.`, ephemeral: true })
}
