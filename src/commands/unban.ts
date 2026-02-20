import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { replyEphemeralEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, createSuccessEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
    .setName('unban')
    .setDescription("Révoquer le bannissement d'un utilisateur")
    .addStringOption(opt => opt.setName('userid').setDescription("L'ID de l'utilisateur à débannir").setRequired(true))
    .addStringOption(opt => opt.setName('raison').setDescription('Raison du débannissement'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('userid', true)
    const reason = interaction.options.getString('raison') || 'Aucune raison fournie'

    console.log(`[cmd:unban] /unban by ${interaction.user.tag} target=${userId} reason=${reason}`)

    if (!interaction.guild) return

    try {
        await interaction.guild.members.unban(userId, reason)

        const embed = createEmbed({
            title: `${Emojis.Success} Débannissement`,
            description: `<@${userId}> (\`${userId}\`) a été débanni.`,
            color: Colors.Success,
            fields: [
                { name: 'Raison', value: reason },
                { name: 'Modérateur', value: `<@${interaction.user.id}>` }
            ],
            footer: 'Sanction révoquée'
        })

        await replyEphemeralEmbed(interaction, embed)
    } catch (err) {
        console.error(err)
        await replyEphemeralEmbed(interaction, createErrorEmbed("Impossible de débannir cet utilisateur. Vérifiez l'ID."))
    }
}
