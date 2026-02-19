"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
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
    const data = JSON.parse(fs_1.default.readFileSync('./pseudos.json', 'utf8') || '[]');
    const existing = data.find(u => u.id === user.id);
    if (existing) {
        existing.display = affichage;
        existing.roblox = roblox;
    }
    else {
        data.push({ id: user.id, display: affichage, roblox });
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
    try {
        fs_1.default.writeFileSync('./pseudos.json', JSON.stringify(data, null, 2));
    }
    catch (err) {
        console.error('failed to write pseudos.json:', err);
        try {
            if (interaction.replied || interaction.deferred)
                await interaction.followUp({ content: "❌ Erreur lors de l'enregistrement.", ephemeral: true });
        }
        catch (_) { }
        return;
    }
    (0, updateMessage_1.updateGlobalMessage)(client);
}
