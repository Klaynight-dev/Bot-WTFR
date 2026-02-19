const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delpseudo')
        .setDescription('Supprime le pseudo d\'un utilisateur')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur dont supprimer le pseudo')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur');
        const member = await interaction.guild.members.fetch(user.id);

        try {
            await member.setNickname(null);
            await interaction.reply(`✅ Pseudo de ${user} supprimé avec succès.`);
        } catch (error) {
            await interaction.reply('❌ Erreur lors de la suppression du pseudo.');
            console.error(error);
        }
    },
};