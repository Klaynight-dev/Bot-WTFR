"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPseudosPage = buildPseudosPage;
exports.updateGlobalMessage = updateGlobalMessage;
const discord_js_1 = require("discord.js");
const prisma_1 = __importDefault(require("../prisma"));
function buildPseudosPage(pseudos = [], page = 0, perPage = 5) {
    const total = Array.isArray(pseudos) ? pseudos.length : 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    page = Math.max(0, Math.min(page, totalPages - 1));
    const start = page * perPage;
    const items = (pseudos || []).slice(start, start + perPage);
    const description = items.length
        ? items.map(u => `• <@${u.id}> — \`${u.display}\` • Roblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`).join('\n')
        : '_Aucun pseudo enregistré._';
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Pseudos enregistrés — WTFR')
        .setColor(0x5865F2)
        .setDescription(description)
        .setFooter({ text: `Page ${page + 1}/${totalPages} • ${total} pseudos` });
    const prev = new discord_js_1.ButtonBuilder().setCustomId('pseudos_prev').setLabel('⬅️ Précédent').setStyle(discord_js_1.ButtonStyle.Primary).setDisabled(page <= 0);
    const search = new discord_js_1.ButtonBuilder().setCustomId('pseudos_search').setLabel('🔎 Rechercher').setStyle(discord_js_1.ButtonStyle.Secondary);
    const next = new discord_js_1.ButtonBuilder().setCustomId('pseudos_next').setLabel('Suivant ➡️').setStyle(discord_js_1.ButtonStyle.Primary).setDisabled(page >= totalPages - 1);
    const row = new discord_js_1.ActionRowBuilder().addComponents(prev, search, next);
    return { embeds: [embed], components: [row], page, totalPages };
}
async function updateGlobalMessage(client) {
    try {
        const pseudos = await prisma_1.default.pseudo.findMany({ orderBy: { createdAt: 'asc' } });
        const msgRow = await prisma_1.default.messageState.findFirst();
        const messageId = msgRow?.messageId;
        const storedChannelId = msgRow?.channelId;
        const preferredChannelId = process.env.CHANNEL_ID || storedChannelId;
        const currentPage = typeof msgRow?.page === 'number' ? msgRow.page : 0;
        const payload = buildPseudosPage(pseudos, currentPage);
        // try éditer le message existant (préférer channel sauvegardé)
        if (messageId) {
            if (storedChannelId) {
                try {
                    const ch = await client.channels.fetch(storedChannelId).catch(() => null);
                    if (ch && typeof ch.messages?.fetch === 'function') {
                        const msg = await ch.messages.fetch(messageId).catch(() => null);
                        if (msg) {
                            await msg.edit({ embeds: payload.embeds, components: payload.components });
                            if (msgRow)
                                await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } });
                            return;
                        }
                    }
                }
                catch (err) {
                    // ignore
                }
            }
            for (const channel of client.channels.cache.values()) {
                if (typeof channel.messages?.fetch !== 'function')
                    continue;
                try {
                    const msg = await channel.messages.fetch(messageId).catch(() => null);
                    if (msg) {
                        await msg.edit({ embeds: payload.embeds, components: payload.components });
                        if (msgRow) {
                            await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { channelId: channel.id, page: payload.page } });
                        }
                        else {
                            await prisma_1.default.messageState.create({ data: { channelId: channel.id, page: payload.page } });
                        }
                        return;
                    }
                }
                catch (err) {
                    // ignore
                }
            }
        }
        // créer un nouveau message si nécessaire
        let targetChannel = null;
        if (preferredChannelId) {
            try {
                const ch = await client.channels.fetch(preferredChannelId).catch(() => null);
                if (ch && ch.isTextBased && ch.permissionsFor?.(ch.guild?.members?.me).has?.('SendMessages')) {
                    targetChannel = ch;
                }
            }
            catch (err) {
                // ignore
            }
        }
        if (!targetChannel) {
            const guild = client.guilds.cache.first();
            if (!guild)
                return;
            targetChannel = guild.channels.cache.find((ch) => ch.isTextBased && ch.permissionsFor(guild.members.me).has('SendMessages'));
            if (!targetChannel)
                return;
        }
        const newMsg = await targetChannel.send({ embeds: payload.embeds, components: payload.components });
        if (msgRow) {
            await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } });
        }
        else {
            await prisma_1.default.messageState.create({ data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } });
        }
    }
    catch (err) {
        console.error('updateGlobalMessage error:', err);
    }
}
