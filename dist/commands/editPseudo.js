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
    .setName('editpseudo')
    .setDescription('Modifier ses pseudos')
    .addStringOption(option => option.setName('affichage').setDescription("Nouveau pseudo d'affichage").setRequired(true))
    .addStringOption(option => option.setName('roblox').setDescription('Nouveau pseudo Roblox').setRequired(true));
async function execute(interaction, client) {
    const affichage = interaction.options.getString('affichage');
    const roblox = interaction.options.getString('roblox');
    const user = interaction.user;
    console.log(`[cmd:editpseudo] /editpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} affichage=${affichage} roblox=${roblox}`);
    const existing = await prisma_1.default.pseudo.findUnique({ where: { id: user.id } });
    if (!existing) {
        const errOpts = { content: "❌ Tu n’as pas enregistré de pseudo.", ephemeral: true };
        try {
            if (!interaction.deferred && !interaction.replied) {
                return await interaction.reply(errOpts);
            }
            else {
                return await interaction.followUp(errOpts);
            }
        }
        catch (err) {
            console.error('interaction reply failed:', err);
            return;
        }
    }
    await prisma_1.default.pseudo.update({ where: { id: user.id }, data: { display: affichage, roblox } });
    const replyOptions = { content: '✅ Pseudos modifiés !', ephemeral: true };
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
