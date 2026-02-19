"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const discord_js_1 = require("discord.js");
const updateMessage_1 = require("./functions/updateMessage");
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
client.commands = new discord_js_1.Collection();
const commandsPath = path_1.default.join(__dirname, 'commands');
if (fs_1.default.existsSync(commandsPath)) {
    const commandFiles = fs_1.default.readdirSync(commandsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    for (const file of commandFiles) {
        // dynamic require works with compiled (dist) JS and with ts-node
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require(path_1.default.join(commandsPath, file));
        client.commands.set(command.data.name, command);
    }
}
client.once('clientReady', () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);
    (0, updateMessage_1.updateGlobalMessage)(client);
    setInterval(() => (0, updateMessage_1.updateGlobalMessage)(client), 14 * 24 * 60 * 60 * 1000);
});
client.on('interactionCreate', async (interaction) => {
    try {
        // Chat commands
        if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command)
                return;
            try {
                await command.execute(interaction, client);
            }
            catch (err) {
                console.error(err);
            }
            return;
        }
        // Button interactions (legacy/public message buttons are mostly disabled now)
        if (interaction.isButton && interaction.isButton()) {
            const id = interaction.customId;
            // Pagination (public message buttons)
            if (id === 'pseudos_prev' || id === 'pseudos_next') {
                const pseudos = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'pseudos.json'), 'utf8') || '[]');
                const msgData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'messageId.json'), 'utf8') || '{}');
                const perPage = 5;
                const totalPages = Math.max(1, Math.ceil(pseudos.length / perPage));
                let page = typeof msgData.page === 'number' ? msgData.page : 0;
                page = id === 'pseudos_next' ? Math.min(totalPages - 1, page + 1) : Math.max(0, page - 1);
                const payload = (0, updateMessage_1.buildPseudosPage)(pseudos, page, perPage);
                msgData.page = payload.page;
                fs_1.default.writeFileSync(path_1.default.join(process.cwd(), 'messageId.json'), JSON.stringify(msgData, null, 2));
                await interaction.update({ embeds: payload.embeds, components: payload.components });
                return;
            }
            // Goto from search results (still supported)
            if (id.startsWith('pseudos_goto_')) {
                const targetId = id.replace('pseudos_goto_', '');
                const pseudos = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'pseudos.json'), 'utf8') || '[]');
                const idx = pseudos.findIndex((u) => u.id === targetId);
                if (idx === -1) {
                    await interaction.reply({ content: 'Utilisateur introuvable dans la liste.', ephemeral: true });
                    return;
                }
                const perPage = 5;
                const page = Math.floor(idx / perPage);
                const payload = (0, updateMessage_1.buildPseudosPage)(pseudos, page, perPage);
                // edit public embed
                const msgData = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'messageId.json'), 'utf8') || '{}');
                if (msgData.channelId && msgData.messageId) {
                    try {
                        const ch = await client.channels.fetch(msgData.channelId).catch(() => null);
                        if (ch) {
                            const msg = await ch.messages.fetch(msgData.messageId).catch(() => null);
                            if (msg) {
                                await msg.edit({ embeds: payload.embeds, components: payload.components });
                                msgData.page = payload.page;
                                fs_1.default.writeFileSync(path_1.default.join(process.cwd(), 'messageId.json'), JSON.stringify(msgData, null, 2));
                            }
                        }
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                await interaction.reply({ content: '✅ Affiché dans le listing public.', ephemeral: true });
                return;
            }
            // Open search modal
            if (id === 'pseudos_search') {
                const modal = new discord_js_1.ModalBuilder().setCustomId('pseudos_modal_search').setTitle('Rechercher un pseudo');
                const input = new discord_js_1.TextInputBuilder().setCustomId('query').setLabel('Discord / affichage / roblox').setStyle(discord_js_1.TextInputStyle.Short).setRequired(true);
                modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
                await interaction.showModal(modal);
                return;
            }
        }
        // Modal submit (search)
        if (interaction.isModalSubmit && interaction.isModalSubmit()) {
            if (interaction.customId === 'pseudos_modal_search') {
                const q = interaction.fields.getTextInputValue('query').trim();
                const pseudos = JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), 'pseudos.json'), 'utf8') || '[]');
                const matches = [];
                const mentionMatch = q.match(/^<@!?(\d+)>$/) || q.match(/^(\d+)$/);
                if (mentionMatch) {
                    const id = mentionMatch[1];
                    matches.push(...pseudos.filter((u) => u.id === id));
                }
                else {
                    const lower = q.toLowerCase();
                    matches.push(...pseudos.filter((u) => (u.display || '').toLowerCase().includes(lower) || (u.roblox || '').toLowerCase().includes(lower)));
                }
                if (matches.length === 0) {
                    await interaction.reply({ content: 'Aucun résultat.', ephemeral: true });
                    return;
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(`Résultats pour "${q}"`)
                    .setColor(0x5865F2)
                    .setDescription(matches.map(u => `• <@${u.id}> — \`${u.display}\` • Roblox: [${u.roblox}](https://www.roblox.com/users/profile?username=${encodeURIComponent(u.roblox)})`).join('\n'))
                    .setFooter({ text: `${matches.length} résultat(s)` });
                const gotoRow = new discord_js_1.ActionRowBuilder();
                const linkRow = new discord_js_1.ActionRowBuilder();
                for (let i = 0; i < Math.min(matches.length, 5); i++) {
                    gotoRow.addComponents(new discord_js_1.ButtonBuilder().setCustomId(`pseudos_goto_${matches[i].id}`).setLabel(`Voir #${i + 1}`).setStyle(discord_js_1.ButtonStyle.Primary));
                    linkRow.addComponents(new discord_js_1.ButtonBuilder().setLabel(`Profil Roblox #${i + 1}`).setStyle(discord_js_1.ButtonStyle.Link).setURL(`https://www.roblox.com/users/profile?username=${encodeURIComponent(matches[i].roblox)}`));
                }
                const components = [];
                if (gotoRow.components.length)
                    components.push(gotoRow);
                if (linkRow.components.length)
                    components.push(linkRow);
                await interaction.reply({ embeds: [embed], components, ephemeral: true });
                return;
            }
        }
    }
    catch (err) {
        console.error('interaction handler error:', err);
    }
});
client.login(process.env.TOKEN);
