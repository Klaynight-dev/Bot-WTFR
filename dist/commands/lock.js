"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('lock')
    .setDescription('Verrouiller un salon (désactive sendMessages pour @everyone)')
    .addChannelOption(opt => opt.setName('channel').setDescription('Salon (par défaut: salon actuel)').addChannelTypes(discord_js_1.ChannelType.GuildText))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageChannels);
async function execute(interaction) {
    const channel = (interaction.options.getChannel('channel') || interaction.channel);
    if (!channel || !channel.permissionOverwrites)
        return interaction.reply({ content: 'Salon invalide.', ephemeral: true });
    try {
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: `🔒 Salon verrouillé : ${channel.name}`, ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: '❌ Impossible de verrouiller le salon.', ephemeral: true });
    }
}
