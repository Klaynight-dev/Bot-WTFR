"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const updateMessage_1 = require("../functions/updateMessage");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('send-pseudo-msg')
    .setDescription('Envoyer (ou recréer) le message public des pseudos')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild);
async function execute(interaction, client) {
    try {
        await (0, updateMessage_1.updateGlobalMessage)(client);
        await interaction.reply({ content: '✅ Message public envoyé / mis à jour.', ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Échec lors de l’envoi du message public.', ephemeral: true });
    }
}
