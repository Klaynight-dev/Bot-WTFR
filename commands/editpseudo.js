const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const { updateGlobalMessage } = require('../functions/updateMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editpseudo')
        .setDescription('Modifier ses pseudos')
        .addStringOption(option =>
            option.setName('affichage')
                .setDescription("Nouveau pseudo d'affichage")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('roblox')
                .setDescription('Nouveau pseudo Roblox')
                .setRequired(true)
        ),

    /**
     * Exécute la commande pour modifier les pseudos de l'utilisateur
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

        if (!existing) {
            const errOpts = { content: "❌ Tu n’as pas enregistré de pseudo.", flags: 64 };
            try {
                if (!interaction.deferred && !interaction.replied) {
                    return await interaction.reply(errOpts);
                } else {
                    return await interaction.followUp(errOpts);
                }
            } catch (err) {
                console.error('interaction reply failed:', err);
                return;
            }
        }

        existing.display = affichage;
        existing.roblox = roblox;

        const replyOptions = { content: "✅ Pseudos modifiés !", flags: 64 };
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
            try { if (interaction.replied || interaction.deferred) await interaction.followUp({ content: '❌ Erreur lors de l\'écriture.', flags: 64 }); } catch (_) {}
            return;
        }

        updateGlobalMessage(client);
    }
};
