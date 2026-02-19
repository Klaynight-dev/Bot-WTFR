const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { updateGlobalMessage } = require('../functions/updateMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setpseudo')
        .setDescription('Définir ses pseudos')
        .addStringOption(option =>
            option.setName('affichage')
                .setDescription("Pseudo d'affichage WTFR")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('roblox')
                .setDescription('Pseudo Roblox')
                .setRequired(true)
        ),

    /**
     * Exécute la commande pour définir ou mettre à jour les pseudos de l'utilisateur
     * @param {import('discord.js').CommandInteraction} interaction
     * @param {import('discord.js').Client} client
     * @returns {Promise<void>}
     */
    async execute(interaction, client) {

        const affichage = interaction.options.getString('affichage');
        const roblox = interaction.options.getString('roblox');
        const user = interaction.user;

        const data = JSON.parse(fs.readFileSync('./pseudos.json'));

        const existing = data.find(u => u.id === user.id);

        if (existing) {
            existing.display = affichage;
            existing.roblox = roblox;
        } else {
            data.push({
                id: user.id,
                display: affichage,
                roblox: roblox
            });
        }

        const replyOptions = { content: "✅ Pseudo enregistré !", flags: 64 };
        try {
            if (!interaction.deferred && !interaction.replied) {
                await interaction.reply(replyOptions);
            } else {
                await interaction.followUp(replyOptions);
            }
        } catch (err) {
            console.error('interaction reply failed:', err);
        }

        try {
            fs.writeFileSync('./pseudos.json', JSON.stringify(data, null, 2));
        } catch (err) {
            console.error('failed to write pseudos.json:', err);
            try { if (interaction.replied || interaction.deferred) await interaction.followUp({ content: '❌ Erreur lors de l\'enregistrement.', flags: 64 }); } catch (_) {}
            return;
        }

        updateGlobalMessage(client);
    }
};
