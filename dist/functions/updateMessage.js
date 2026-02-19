"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPseudos = getPseudos;
exports.buildPseudosPage = buildPseudosPage;
exports.updateGlobalMessage = updateGlobalMessage;
const discord_js_1 = require("discord.js");
const prisma_1 = __importStar(require("../prisma"));
async function getPseudos() {
    if (!prisma_1.prismaEnabled)
        return [];
    return prisma_1.default.pseudo.findMany({ orderBy: { createdAt: 'asc' } });
}
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
        console.log('[updateGlobalMessage] invoked');
        if (!prisma_1.prismaEnabled) {
            console.warn('[updateGlobalMessage] Prisma disabled — skipping DB operations');
            return;
        }
        console.log('[updateGlobalMessage] fetching pseudos from DB (timeout 5s)...');
        const pseudos = await Promise.race([
            getPseudos(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('getPseudos timed out after 5000ms')), 5000))
        ]);
        console.log(`[updateGlobalMessage] fetched pseudos=${Array.isArray(pseudos) ? pseudos.length : 'N/A'}`);
        console.log('[updateGlobalMessage] fetching messageState from DB (timeout 5s)...');
        const msgRow = await Promise.race([
            prisma_1.default.messageState.findFirst(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('messageState.findFirst timed out after 5000ms')), 5000))
        ]);
        console.log(`[updateGlobalMessage] messageState=${JSON.stringify(msgRow)}`);
        const messageId = msgRow?.messageId;
        const storedChannelId = msgRow?.channelId;
        const preferredChannelId = process.env.CHANNEL_ID || storedChannelId;
        const currentPage = typeof msgRow?.page === 'number' ? msgRow.page : 0;
        console.log(`[updateGlobalMessage] start — page=${currentPage} preferredChannel=${preferredChannelId} messageId=${messageId}`);
        const payload = buildPseudosPage(pseudos, currentPage);
        // try éditer le message existant (préférer channel sauvegardé)
        if (messageId) {
            if (storedChannelId) {
                try {
                    const ch = await client.channels.fetch(storedChannelId).catch(() => null);
                    if (ch && typeof ch.messages?.fetch === 'function') {
                        const msg = await ch.messages.fetch(messageId).catch(() => null);
                        if (msg) {
                            console.log(`[updateGlobalMessage] editing message ${messageId} in channel ${ch.id}`);
                            await msg.edit({ embeds: payload.embeds, components: payload.components });
                            if (msgRow?.id) {
                                await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { page: payload.page } });
                            }
                            else {
                                await prisma_1.default.messageState.create({ data: { messageId: msg.id, channelId: ch.id, page: payload.page } });
                            }
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
                        console.log(`[updateGlobalMessage] found message ${messageId} in channel ${channel.id} — editing`);
                        await msg.edit({ embeds: payload.embeds, components: payload.components });
                        if (msgRow?.id) {
                            await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { channelId: channel.id, page: payload.page } });
                        }
                        else {
                            await prisma_1.default.messageState.create({ data: { messageId: msg.id, channelId: channel.id, page: payload.page } });
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
        console.log(`[updateGlobalMessage] creating new message in channel ${targetChannel.id}`);
        const newMsg = await targetChannel.send({ embeds: payload.embeds, components: payload.components });
        if (msgRow?.id) {
            await prisma_1.default.messageState.update({ where: { id: msgRow.id }, data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } });
        }
        else {
            await prisma_1.default.messageState.create({ data: { messageId: newMsg.id, channelId: targetChannel.id, page: payload.page } });
        }
    }
    catch (err) {
        console.error('updateGlobalMessage error:', err && (err.stack || err.message) ? (err.stack || err) : err);
        // rethrow so callers (commands) can react and finish deferred replies
        throw err;
    }
}
