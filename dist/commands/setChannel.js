"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const updateMessage_1 = require("../functions/updateMessage");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('setchannel')
    .setDescription("Définir le salon où poster l'embed public")
    .addChannelOption(opt => opt.setName('channel').setDescription('Salon texte').setRequired(true).addChannelTypes(discord_js_1.ChannelType.GuildText))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild);
async function execute(interaction, client) {
    const channel = interaction.options.getChannel('channel', true);
    const file = path_1.default.join(process.cwd(), 'messageId.json');
    let msgData = {};
    try {
        if (fs_1.default.existsSync(file))
            msgData = JSON.parse(fs_1.default.readFileSync(file, 'utf8') || '{}');
    }
    catch (err) { /* ignore */ }
    msgData.channelId = channel.id;
    // force rebuild of public message
    delete msgData.messageId;
    msgData.page = 0;
    fs_1.default.writeFileSync(file, JSON.stringify(msgData, null, 2));
    try {
        await (0, updateMessage_1.updateGlobalMessage)(client);
        await interaction.reply({ content: `✅ Salon de listing défini sur <#${channel.id}>.`, ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: "❌ Erreur lors de la mise à jour du message public.", ephemeral: true });
    }
}
