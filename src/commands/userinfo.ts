import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js'
import { replyEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'
import moment from 'moment'

export const data = new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription("Affiche les informations sur un utilisateur")
    .addUserOption(option => option.setName('cible').setDescription("L'utilisateur à analyser").setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('cible') || interaction.user
    const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null)

    const roles = member?.roles.cache
        .filter(r => r.name !== '@everyone')
        .map(r => r)
        .sort((a, b) => b.position - a.position)
        .map(r => `<@&${r.id}>`)
        .join(', ') || 'Aucun'

    const joinedAt = member?.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Inconnu'
    const createdAt = `<t:${Math.floor(targetUser.createdAt.getTime() / 1000)}:R>`

    const embed = createEmbed({
        title: `${Emojis.Info} Informations sur ${targetUser.username}`, // Info icon
        color: member?.displayColor || Colors.Info,
        thumbnail: targetUser.displayAvatarURL({ size: 1024 }),
        fields: [
            { name: 'Identifiant', value: `\`${targetUser.id}\``, inline: true },
            { name: 'Créé le', value: createdAt, inline: true },
            { name: 'Rejoint le', value: joinedAt, inline: true },
            { name: `Rôles [${member?.roles.cache.size ? member.roles.cache.size - 1 : 0}]`, value: roles.length > 1024 ? 'Trop de rôles à afficher.' : roles }
        ],
        footer: `Demandé par ${interaction.user.tag}`
    })

    await replyEmbed(interaction, embed)
}
