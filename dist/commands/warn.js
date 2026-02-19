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
    .setName('warn')
    .setDescription("Ajouter un avertissement à un utilisateur")
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur', true);
    const reason = interaction.options.getString('raison', true);
    const warnings = fs_1.default.existsSync(WARN_FILE) ? JSON.parse(fs_1.default.readFileSync(WARN_FILE, 'utf8') || '[]') : [];
    warnings.push({ id: user.id, moderator: interaction.user.id, reason, date: new Date().toISOString() });
    fs_1.default.writeFileSync(WARN_FILE, JSON.stringify(warnings, null, 2));
    await interaction.reply({ content: `⚠️ ${user.tag} averti.`, ephemeral: true });
}
