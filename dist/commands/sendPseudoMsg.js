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
    console.log(`[cmd:send-pseudo-msg] /send-pseudo-msg by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`);
    try {
        // deferring so interaction won't expire while updateGlobalMessage runs
        await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
        await (0, updateMessage_1.updateGlobalMessage)(client);
        await interaction.editReply({ content: '✅ Message public envoyé / mis à jour.' });
    }
    catch (err) {
        console.error(err);
        try {
            await interaction.editReply({ content: '❌ Échec lors de l’envoi du message public.' });
        }
        catch (_) { }
    }
}
