"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const prisma_1 = __importDefault(require("../prisma"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('warn')
    .setDescription("Ajouter un avertissement à un utilisateur")
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Utilisateur').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison').setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur', true);
    const reason = interaction.options.getString('raison', true);
    console.log(`[cmd:warn] /warn by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} reason=${reason}`);
    await prisma_1.default.warning.create({ data: { userId: user.id, moderatorId: interaction.user.id, reason } });
    await interaction.reply({ content: `⚠️ ${user.tag} averti.`, flags: discord_js_1.MessageFlags.Ephemeral });
}
