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
            return interaction.reply({
                content: "❌ Tu n’as pas enregistré de pseudo.",
                ephemeral: true
            });
        }

        existing.display = affichage;
        existing.roblox = roblox;

        fs.writeFileSync('./pseudos.json', JSON.stringify(data, null, 2));

        await interaction.reply({
            content: "✅ Pseudos modifiés !",
            ephemeral: true
        });

        updateGlobalMessage(client);
    }
};
