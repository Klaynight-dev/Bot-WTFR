"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un membre')
    .addUserOption(opt => opt.setName('utilisateur').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison'))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.KickMembers);
async function execute(interaction) {
    const user = interaction.options.getUser('utilisateur', true);
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
    console.log(`[cmd:kick] /kick by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} target=${user.tag || user.id} reason=${reason}`);
    if (!interaction.guild)
        return interaction.reply({ content: 'Commande utilisable uniquement en serveur.', ephemeral: true });
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member)
        return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    try {
        await member.kick(reason);
        await interaction.reply({ content: `✅ ${user.tag} expulsé.`, ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Impossible d\'expulser ce membre.', ephemeral: true });
    }
}
