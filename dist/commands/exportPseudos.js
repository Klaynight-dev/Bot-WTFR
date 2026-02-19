"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../prisma"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('exportpseudos')
    .setDescription('Télécharger le fichier pseudos.json')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const pseudos = await prisma_1.default.pseudo.findMany({ orderBy: { createdAt: 'asc' } });
    const filePath = path_1.default.join(process.cwd(), 'pseudos.json');
    fs_1.default.writeFileSync(filePath, JSON.stringify(pseudos, null, 2));
    await interaction.reply({ files: [{ attachment: filePath, name: 'pseudos.json' }], ephemeral: true });
}
