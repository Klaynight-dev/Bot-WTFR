import fs from 'fs'
import path from 'path'
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

// branding image location inside repository
const BRANDING_LOCAL_PATH = path.resolve(process.cwd(), 'contents', 'img', 'logo.png')
function _brandingExists() { return fs.existsSync(BRANDING_LOCAL_PATH) }

export function getBrandingAttachment(): { path: string; name: string } | null {
  if (_brandingExists()) return { path: BRANDING_LOCAL_PATH, name: 'logo.png' }
  return null
}

export function makeEmbed(opts: { title?: string; description?: string; color?: number; fields?: { name: string; value: string; inline?: boolean }[]; footer?: string; footerIconUrl?: string; type?: 'success' | 'error' | 'info' | 'warn' | 'neutral' }) {
  const embed = new EmbedBuilder()

  // style presets
  const type = opts.type ?? 'neutral'
  const palette: Record<string, { color: number; emoji: string }> = {
    success: { color: 0x2ECC71, emoji: '✅' },
    error: { color: 0xE74C3C, emoji: '❌' },
    info: { color: 0x5865F2, emoji: 'ℹ️' },
    warn: { color: 0xFFA500, emoji: '⚠️' },
    neutral: { color: 0x2F3136, emoji: '' }
  }

  const preset = palette[type]

  if (opts.title) {
    const title = `${preset.emoji ? `${preset.emoji} ` : ''}${opts.title}`
    embed.setTitle(title)
  }
  if (opts.description) embed.setDescription(opts.description)
  embed.setColor(opts.color ?? preset.color)
  if (opts.fields) embed.addFields(...opts.fields)
  embed.setTimestamp()

  // Branding footer applied to every embed (append if caller provided a footer)
  const branding = 'Powered by WarBot FR • by @klaynight'
  const footerText = opts.footer ? `${opts.footer} • ${branding}` : branding
  const footerPayload: any = { text: footerText }

  // default footer/icon uses local logo if present (referenced as an attachment)
  const defaultIcon = _brandingExists() ? 'attachment://logo.png' : undefined
  const iconUrl = opts.footerIconUrl ?? defaultIcon
  if (iconUrl) footerPayload.iconURL = iconUrl
  embed.setFooter(footerPayload)

  return embed
}

// Generic reply helper: allows choosing between public or ephemeral replies easily
export async function replyEmbed(interaction: ChatInputCommandInteraction, embed: EmbedBuilder, secret = false) {
  return sendPublicOrSecret(interaction, embed, secret)
}

async function _maybeAttachAndReply(interaction: ChatInputCommandInteraction, options: any) {
  const branding = getBrandingAttachment()
  if (!branding) return interaction.reply(options)
  // attach branding file only if embed references attachment://logo.png anywhere
  const embed: EmbedBuilder | undefined = Array.isArray(options?.embeds) ? options.embeds[0] : undefined
  const wantsAttachment = Boolean(
    embed && (
      embed.data?.footer?.icon_url?.startsWith?.('attachment://') ||
      embed.data?.author?.icon_url?.startsWith?.('attachment://') ||
      embed.data?.thumbnail?.url?.startsWith?.('attachment://')
    )
  )
  if (!wantsAttachment) return interaction.reply(options)
  return interaction.reply({ ...options, files: [{ attachment: branding.path, name: branding.name }] })
}

export async function sendPublicOrSecret(interaction: ChatInputCommandInteraction, embed: EmbedBuilder, secret = false) {
  if (secret) {
    if (!interaction.deferred && !interaction.replied) {
      return _maybeAttachAndReply(interaction, { embeds: [embed], flags: 64 })
    } else {
      const branding = getBrandingAttachment()
      if (!branding) return interaction.followUp({ embeds: [embed], flags: 64 })
      const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
      if (!wantsAttachment) return interaction.followUp({ embeds: [embed], flags: 64 })
      return interaction.followUp({ embeds: [embed], flags: 64, files: [{ attachment: branding.path, name: branding.name }] })
    }
  }

  const ch: any = interaction.channel
  if (ch && typeof ch.send === 'function') {
    try {
      const branding = getBrandingAttachment()
      const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
      if (branding && wantsAttachment) {
        await ch.send({ embeds: [embed], files: [{ attachment: branding.path, name: branding.name }] })
      } else {
        await ch.send({ embeds: [embed] })
      }
    } catch (err) {
      if (!interaction.deferred && !interaction.replied) {
        return _maybeAttachAndReply(interaction, { embeds: [embed], flags: 64 })
      } else {
        const branding = getBrandingAttachment()
        if (!branding) return interaction.followUp({ embeds: [embed], flags: 64 })
        const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
        if (!wantsAttachment) return interaction.followUp({ embeds: [embed], flags: 64 })
        return interaction.followUp({ embeds: [embed], flags: 64, files: [{ attachment: branding.path, name: branding.name }] })
      }
    }

    const confirm = { content: '✅ Message public envoyé.', flags: 64 }
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply(confirm)
    } else {
      await interaction.followUp(confirm)
    }
    return
  }

  return _maybeAttachAndReply(interaction, { embeds: [embed], flags: 64 })
}

export async function replyEphemeralEmbed(interaction: ChatInputCommandInteraction, embed: EmbedBuilder) {
  // centralized ephemeral reply that attaches branding image when required
  if (!interaction.deferred && !interaction.replied) {
    return _maybeAttachAndReply(interaction, { embeds: [embed], flags: 64 })
  } else {
    const branding = getBrandingAttachment()
    if (!branding) return interaction.followUp({ embeds: [embed], flags: 64 })
    const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
    if (!wantsAttachment) return interaction.followUp({ embeds: [embed], flags: 64 })
    return interaction.followUp({ embeds: [embed], flags: 64, files: [{ attachment: branding.path, name: branding.name }] })
  }
}
