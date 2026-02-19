"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Bannir temporairement un membre (ne survive pas au redémarrage)')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à bannir').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Durée en minutes').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    console.log(`[cmd:tempban] /tempban by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} minutes=${minutes} reason=${reason}`);
    if (!interaction.guild)
        return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', flags: discord_js_1.MessageFlags.Ephemeral });
    try {
        await interaction.guild.members.ban(user.id, { reason });
        await interaction.reply({ content: `✅ ${user.tag} banni pour ${minutes} minute(s). (attention : ne survive pas au redémarrage du bot)`, flags: discord_js_1.MessageFlags.Ephemeral });
        const ms = minutes * 60 * 1000;
        setTimeout(async () => {
            try {
                await interaction.guild.members.unban(user.id);
                console.log(`Tempban retiré pour ${user.id}`);
            }
            catch (err) {
                console.error('failed to unban (tempban):', err);
            }
        }, ms);
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Impossible de bannir ce membre.', flags: discord_js_1.MessageFlags.Ephemeral });
    }
}
