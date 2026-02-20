import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js'
import { replyEphemeralEmbed, replyEmbed } from '../functions/respond'
import { createEmbed, Colors, Emojis } from '../utils/style'

export const data = new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Mettre en place le système de tickets')
    .addChannelOption(opt => opt.setName('channel').setDescription('Salon où poster le message').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true) as any

    const embed = createEmbed({
        title: '📨 Support / Ticket',
        description: 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket et contacter le staff.',
        color: Colors.Primary,
        footer: 'Support'
    })

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_open')
            .setLabel('Ouvrir un ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📩')
    )

    try {
        await channel.send({ embeds: [embed], components: [row] })
        await replyEphemeralEmbed(interaction, createEmbed({
            title: `${Emojis.Success} Succès`,
            description: `Message de ticket envoyé dans ${channel}.`,
            color: Colors.Success
        }))
    } catch (error) {
        console.error(error)
        await replyEphemeralEmbed(interaction, createEmbed({
            title: `${Emojis.Error} Erreur`,
            description: "Impossible d'envoyer le message.",
            color: Colors.Error
        }))
    }
}
