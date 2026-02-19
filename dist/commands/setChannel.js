"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const prisma_1 = __importDefault(require("../prisma"));
const updateMessage_1 = require("../functions/updateMessage");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('setchannel')
    .setDescription("Définir le salon où poster l'embed public")
    .addChannelOption(opt => opt.setName('channel').setDescription('Salon texte').setRequired(true).addChannelTypes(discord_js_1.ChannelType.GuildText))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ManageGuild);
async function execute(interaction, client) {
    const channel = interaction.options.getChannel('channel', true);
    console.log(`[cmd:setchannel] /setchannel by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'} -> targetChannel=${channel.id}`);
    const msgRow = await prisma_1.default.messageState.findFirst();
    if (msgRow) {
        await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { channelId: channel.id, messageId: null, page: 0 } });
    }
    else {
        await prisma_1.default.messageState.create({ data: { channelId: channel.id, page: 0 } });
    }
    try {
        await (0, updateMessage_1.updateGlobalMessage)(client);
        await interaction.reply({ content: `✅ Salon de listing défini sur <#${channel.id}>.`, ephemeral: true });
    }
    catch (err) {
        console.error(err);
        await interaction.reply({ content: "❌ Erreur lors de la mise à jour du message public.", ephemeral: true });
    }
}
