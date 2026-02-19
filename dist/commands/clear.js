"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer N messages (bulk delete)')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Nombre de messages (max 100)').setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageMessages);
async function execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const channel = interaction.channel;
    if (!channel || typeof channel.bulkDelete !== 'function')
        return interaction.reply({ content: 'Commande utilisable uniquement dans un salon texte.', ephemeral: true });
    try {
        const deleted = await channel.bulkDelete(Math.min(amount, 100), true);
        await interaction.reply({ content: `✅ Supprimé ${deleted.size} message(s).`, ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Échec lors de la suppression.', ephemeral: true });
    }
}
