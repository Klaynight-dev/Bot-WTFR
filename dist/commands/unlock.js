"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Déverrouiller un salon')
    .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(discord_js_1.ChannelType.GuildText))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels);
async function execute(interaction) {
    const channel = (interaction.options.getChannel('channel') || interaction.channel);
    console.log(`[cmd:unlock] /unlock by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} targetChannel=${channel?.id || 'N/A'}`);
    if (!channel || !channel.permissionOverwrites)
        return interaction.reply({ content: 'Salon invalide.', ephemeral: true });
    try {
        // retirer l'override (mettre à null)
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        await interaction.reply({ content: `🔓 Salon déverrouillé : ${channel.name}`, ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Impossible de déverrouiller le salon.', ephemeral: true });
    }
}
