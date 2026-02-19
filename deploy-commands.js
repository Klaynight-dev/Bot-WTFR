require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

/**
 * Déploie les commandes slash auprès de l'API Discord
 * @param {string} clientId - L'ID de l'application (bot)
 * @param {string} guildId - L'ID de la guilde où déployer les commandes
 * @param {Array} commands - La liste des commandes à déployer
 * @returns {Promise<void>}
 */
(async () => {
    try {
        console.log('⏳ Déploiement des commandes...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('✅ Commandes déployées !');
    } catch (error) {
        console.error(error);
    }
})();
