"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const WARN_FILE = './warnings.json';
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('warns')
    .setDescription("Afficher les avertissements d'un utilisateur")
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur (si omis, affichera les warnings de la personne ciblée)').setRequired(false))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur') || interaction.user;
    const warnings = fs_1.default.existsSync(WARN_FILE) ? JSON.parse(fs_1.default.readFileSync(WARN_FILE, 'utf8') || '[]') : [];
    const userWarnings = warnings.filter((w) => w.id === user.id);
    if (userWarnings.length === 0)
        return interaction.reply({ content: 'Aucun avertissement pour cet utilisateur.', ephemeral: true });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`Avertissements — ${user.tag}`)
        .setDescription(userWarnings.map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderator}> (${new Date(w.date).toLocaleString()})`).join('\n'))
        .setColor(0xFFA500);
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
