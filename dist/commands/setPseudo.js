"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const prisma_1 = __importDefault(require("../prisma"));
const updateMessage_1 = require("../functions/updateMessage");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('setpseudo')
    .setDescription('Définir ses pseudos')
    .addStringOption(option => option.setName('affichage').setDescription("Pseudo d'affichage WTFR").setRequired(true))
    .addStringOption(option => option.setName('roblox').setDescription('Pseudo Roblox').setRequired(true));
async function execute(interaction, client) {
    const affichage = interaction.options.getString('affichage');
    const roblox = interaction.options.getString('roblox');
    const user = interaction.user;
    try {
        await prisma_1.default.pseudo.upsert({
            where: { id: user.id },
            update: { display: affichage, roblox },
            create: { id: user.id, display: affichage, roblox }
        });
    }
    catch (err) {
        console.error('prisma upsert pseudo failed:', err);
        try {
            await interaction.reply({ content: "❌ Erreur lors de l'enregistrement.", ephemeral: true });
        }
        catch (_) { }
        return;
    }
    const replyOptions = { content: '✅ Pseudo enregistré !', ephemeral: true };
    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.reply(replyOptions);
        }
        else {
            await interaction.followUp(replyOptions);
        }
    }
    catch (err) {
        console.error('interaction reply failed:', err);
    }
    (0, updateMessage_1.updateGlobalMessage)(client);
}
