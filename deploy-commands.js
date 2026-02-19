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
    const CLIENT_ID = process.env.CLIENT_ID;
    const GUILD_ID = process.env.GUILD_ID;
    const SCOPE = (process.env.DEPLOY_SCOPE || 'guild').toLowerCase();

    try {
        console.log(`⏳ Déploiement des commandes (scope=${SCOPE})...`);

        if (SCOPE === 'guild') {
            if (!GUILD_ID) throw new Error('GUILD_ID requis pour le déploiement en guilde');

            // Déployer uniquement en guilde
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
            // Nettoyer les commandes globales restantes (évite les commandes fantômes)
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });

            console.log('✅ Commandes déployées en guilde — commandes globales supprimées.');
        } else if (SCOPE === 'global') {
            // Déployer globalement
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
            // Supprimer les commandes de la guilde cible si elle existe
            if (GUILD_ID) await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });

            console.log('✅ Commandes déployées globalement — commandes de guilde supprimées.');
        } else {
            throw new Error(`DEPLOY_SCOPE invalide : ${SCOPE} (utiliser 'guild' ou 'global')`);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
