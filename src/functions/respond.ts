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

export function makeEmbed(opts: { title?: string; description?: string; color?: number; fields?: { name: string; value: string; inline?: boolean }[]; footer?: string; footerIconUrl?: string }) {
  const embed = new EmbedBuilder()
  if (opts.title) embed.setTitle(opts.title)
  if (opts.description) embed.setDescription(opts.description)
  embed.setColor(opts.color ?? 0x5865F2)
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
      return _maybeAttachAndReply(interaction, { embeds: [embed], ephemeral: true })
    } else {
      const branding = getBrandingAttachment()
      if (!branding) return interaction.followUp({ embeds: [embed], ephemeral: true })
      const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
      if (!wantsAttachment) return interaction.followUp({ embeds: [embed], ephemeral: true })
      return interaction.followUp({ embeds: [embed], ephemeral: true, files: [{ attachment: branding.path, name: branding.name }] })
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
        return _maybeAttachAndReply(interaction, { embeds: [embed], ephemeral: true })
      } else {
        const branding = getBrandingAttachment()
        if (!branding) return interaction.followUp({ embeds: [embed], ephemeral: true })
        const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
        if (!wantsAttachment) return interaction.followUp({ embeds: [embed], ephemeral: true })
        return interaction.followUp({ embeds: [embed], ephemeral: true, files: [{ attachment: branding.path, name: branding.name }] })
      }
      return
    }

    const confirm = { content: '✅ Message public envoyé.', ephemeral: true }
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply(confirm)
    } else {
      await interaction.followUp(confirm)
    }
    return
  }

  return _maybeAttachAndReply(interaction, { embeds: [embed], ephemeral: true })
}

export async function replyEphemeralEmbed(interaction: ChatInputCommandInteraction, embed: EmbedBuilder) {
  // centralized ephemeral reply that attaches branding image when required
  if (!interaction.deferred && !interaction.replied) {
    return _maybeAttachAndReply(interaction, { embeds: [embed], ephemeral: true })
  } else {
    const branding = getBrandingAttachment()
    if (!branding) return interaction.followUp({ embeds: [embed], ephemeral: true })
    const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
    if (!wantsAttachment) return interaction.followUp({ embeds: [embed], ephemeral: true })
    return interaction.followUp({ embeds: [embed], ephemeral: true, files: [{ attachment: branding.path, name: branding.name }] })
  }
}
