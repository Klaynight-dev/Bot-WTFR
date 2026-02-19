"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const discord_js_1 = require("discord.js");
const commands = [];
const commandsPath = path_1.default.join(__dirname, 'commands');
if (fs_1.default.existsSync(commandsPath)) {
    const commandFiles = fs_1.default.readdirSync(commandsPath).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    for (const file of commandFiles) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require(path_1.default.join(commandsPath, file));
        commands.push(command.data.toJSON());
    }
}
const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('⏳ Déploiement des commandes...');
        await rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Commandes déployées !');
    }
    catch (error) {
        console.error(error);
    }
})();
