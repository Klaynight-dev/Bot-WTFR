import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'
import prisma from '../prisma'
import { createEmbed, createSuccessEmbed, createErrorEmbed, Colors } from '../utils/style'

export const data = new SlashCommandBuilder()
    .setName('levels')
    .setDescription("Configuration du système de niveaux")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
        sub.setName('config')
            .setDescription('Configurer les paramètres généraux')
            .addBooleanOption(opt => opt.setName('active').setDescription('Activer/Désactiver le système'))
            .addIntegerOption(opt => opt.setName('xp_min').setDescription('XP minimum par message'))
            .addIntegerOption(opt => opt.setName('xp_max').setDescription('XP maximum par message'))
            .addIntegerOption(opt => opt.setName('voice_xp').setDescription('XP par intervalle vocal'))
            .addChannelOption(opt => opt.setName('channel').setDescription('Salon pour les annonces de niveau').addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand(sub =>
        sub.setName('reward')
            .setDescription('Ajouter une récompense de rôle')
            .addIntegerOption(opt => opt.setName('niveau').setDescription('Niveau à atteindre').setRequired(true))
            .addRoleOption(opt => opt.setName('role').setDescription('Rôle à donner').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('unreward')
            .setDescription('Retirer une récompense de rôle')
            .addIntegerOption(opt => opt.setName('niveau').setDescription('Niveau de la récompense à supprimer').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('list')
            .setDescription('Afficher la configuration actuelle et les récompenses')
    )
    .addSubcommand(sub =>
        sub.setName('multiplier-add')
            .setDescription('Ajouter un multiplicateur d\'XP')
            .addStringOption(opt => opt.setName('type').setDescription('Type').setRequired(true).addChoices(
                { name: 'Rôle', value: 'ROLE' },
                { name: 'Salon', value: 'CHANNEL' },
                { name: 'Utilisateur', value: 'USER' }
            ))
            .addStringOption(opt => opt.setName('id').setDescription('ID du Rôle/Salon/Utilisateur').setRequired(true))
            .addNumberOption(opt => opt.setName('value').setDescription('Multiplicateur (ex: 1.5, 2.0)').setRequired(true))
    )
    .addSubcommand(sub =>
        sub.setName('multiplier-remove')
            .setDescription('Supprimer un multiplicateur d\'XP')
            .addIntegerOption(opt => opt.setName('id').setDescription('ID du multiplicateur (voir /levels list)').setRequired(true))
    )

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    const guildId = interaction.guildId!

    if (subcommand === 'config') {
        const enabled = interaction.options.getBoolean('active')
        const xpMin = interaction.options.getInteger('xp_min')
        const xpMax = interaction.options.getInteger('xp_max')
        const voiceXp = interaction.options.getInteger('voice_xp')
        const channel = interaction.options.getChannel('channel')

        const data: any = {}
        if (enabled !== null) data.enabled = enabled
        if (xpMin !== null) data.messageXpMin = xpMin
        if (xpMax !== null) data.messageXpMax = xpMax
        if (voiceXp !== null) data.voiceXp = voiceXp
        if (channel) data.announceChannelId = channel.id

        const config = await prisma.levelConfig.upsert({
            where: { guildId },
            create: { guildId, ...data },
            update: data
        })

        return interaction.reply({ embeds: [createSuccessEmbed('Configuration mise à jour avec succès.')], flags: 64 })
    }

    if (subcommand === 'reward') {
        const level = interaction.options.getInteger('niveau', true)
        const role = interaction.options.getRole('role', true)

        await prisma.levelReward.upsert({
            where: { guildId_level: { guildId, level } },
            create: { guildId, level, roleId: role.id },
            update: { roleId: role.id }
        })

        return interaction.reply({ embeds: [createSuccessEmbed(`Récompense définie : Rôle <@&${role.id}> au niveau ${level}.`)], flags: 64 })
    }

    if (subcommand === 'unreward') {
        const level = interaction.options.getInteger('niveau', true)

        await prisma.levelReward.deleteMany({
            where: { guildId, level }
        })

        return interaction.reply({ embeds: [createSuccessEmbed(`Récompense pour le niveau ${level} supprimée.`)], flags: 64 })
    }

    if (subcommand === 'multiplier-add') {
        const type = interaction.options.getString('type', true)
        const targetId = interaction.options.getString('id', true)
        const multiplier = interaction.options.getNumber('value', true)

        await prisma.levelMultiplier.create({
            data: { guildId, type, targetId, multiplier }
        })

        return interaction.reply({ embeds: [createSuccessEmbed(`Multiplicateur ajouté : ${multiplier}x pour ${type} ${targetId}.`)], flags: 64 })
    }

    if (subcommand === 'multiplier-remove') {
        const id = interaction.options.getInteger('id', true)

        await prisma.levelMultiplier.deleteMany({
            where: { id, guildId } // Ensure guildId matches for security
        })

        return interaction.reply({ embeds: [createSuccessEmbed(`Multiplicateur #${id} supprimé.`)], flags: 64 })
    }

    if (subcommand === 'list') {
        const config = await prisma.levelConfig.findUnique({ where: { guildId } })
        const rewards = await prisma.levelReward.findMany({ where: { guildId }, orderBy: { level: 'asc' } })
        const multipliers = await prisma.levelMultiplier.findMany({ where: { guildId } })

        const embed = createEmbed({
            title: '⚙️ Configuration des Niveaux',
            color: Colors.Neutral,
            fields: [
                { name: 'État', value: config?.enabled ? '✅ Activé' : '❌ Désactivé', inline: true },
                { name: 'XP Message', value: `${config?.messageXpMin ?? 15} - ${config?.messageXpMax ?? 25}`, inline: true },
                { name: 'XP Vocal', value: `${config?.voiceXp ?? 10} / ${config?.voiceInterval ?? 60}s`, inline: true },
                { name: 'Salon Annonce', value: config?.announceChannelId ? `<#${config.announceChannelId}>` : 'Défaut', inline: true },
                { name: 'Récompenses', value: rewards.length ? rewards.map(r => `• Niveau **${r.level}** : <@&${r.roleId}>`).join('\n') : 'Aucune' },
                { name: 'Multiplicateurs', value: multipliers.length ? multipliers.map(m => `• **#${m.id}** : ${m.multiplier}x (${m.type} ${m.targetId})`).join('\n') : 'Aucun' }
            ]
        })

        return interaction.reply({ embeds: [embed] })
    }
}
