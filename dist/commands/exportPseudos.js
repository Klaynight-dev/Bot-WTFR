"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('exportpseudos')
    .setDescription('Télécharger le fichier pseudos.json')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const filePath = path_1.default.join(process.cwd(), 'pseudos.json');
    await interaction.reply({ files: [{ attachment: filePath, name: 'pseudos.json' }], ephemeral: true });
}
