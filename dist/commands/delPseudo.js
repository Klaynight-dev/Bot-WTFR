"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('delpseudo')
    .setDescription("Supprime le pseudo d'un utilisateur")
    .addUserOption(option => option.setName('utilisateur').setDescription("L'utilisateur dont supprimer le pseudo").setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    console.log(`[cmd:delpseudo] /delpseudo by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id}`);
    const member = await interaction.guild.members.fetch(user.id);
    try {
        await member.setNickname(null);
        await interaction.reply(`✅ Pseudo de ${user} supprimé avec succès.`);
    }
    catch (error) {
        await interaction.reply('❌ Erreur lors de la suppression du pseudo.');
        console.error(error);
    }
}
