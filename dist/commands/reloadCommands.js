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
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('reload-commands')
    .setDescription('Recharger les commandes sans redémarrer (dev/prod)')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
function getCommandsDir() {
    const distPath = path_1.default.join(process.cwd(), 'dist', 'commands');
    const srcPath = path_1.default.join(process.cwd(), 'src', 'commands');
    if (fs_1.default.existsSync(distPath))
        return distPath;
    return srcPath;
}
async function execute(interaction, client) {
    const commandsDir = getCommandsDir();
    const files = fs_1.default.existsSync(commandsDir) ? fs_1.default.readdirSync(commandsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts')) : [];
    // clear existing
    client.commands.clear();
    for (const file of files) {
        const fp = path_1.default.join(commandsDir, file);
        try {
            delete require.cache[require.resolve(fp)];
        }
        catch (err) { }
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const command = require(fp);
            if (command?.data?.name)
                client.commands.set(command.data.name, command);
        }
        catch (err) {
            console.error('failed loading command', fp, err);
        }
    }
    await interaction.reply({ content: `✅ ${client.commands.size} commandes rechargées.`, ephemeral: true });
}
