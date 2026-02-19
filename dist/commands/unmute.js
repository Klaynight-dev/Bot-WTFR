"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Retirer le timeout (unmute) d\'un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à unmute').setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur', true);
    console.log(`[cmd:unmute] /unmute by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id}`);
    if (!interaction.guild)
        return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', flags: discord_js_1.MessageFlags.Ephemeral });
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member)
        return interaction.reply({ content: 'Membre introuvable.', flags: discord_js_1.MessageFlags.Ephemeral });
    try {
        await member.timeout(null);
        await interaction.reply({ content: `✅ Timeout retiré pour ${user.tag}.`, flags: discord_js_1.MessageFlags.Ephemeral });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Impossible de retirer le timeout.', flags: discord_js_1.MessageFlags.Ephemeral });
    }
}
