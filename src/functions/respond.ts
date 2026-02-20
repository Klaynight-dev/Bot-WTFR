import fs from 'fs'
import path from 'path'
import { ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js'
import { createEmbed, EmbedOptions } from '../utils/style'

// branding image location inside repository
const BRANDING_LOCAL_PATH = path.resolve(process.cwd(), 'contents', 'img', 'logo.png')
function _brandingExists() { return fs.existsSync(BRANDING_LOCAL_PATH) }

export function getBrandingAttachment(): { path: string; name: string } | null {
  if (_brandingExists()) return { path: BRANDING_LOCAL_PATH, name: 'logo.png' }
  return null
}

export function makeEmbed(opts: { title?: string; description?: string; color?: number; fields?: { name: string; value: string; inline?: boolean }[]; footer?: string; footerIconUrl?: string; type?: 'success' | 'error' | 'info' | 'warn' | 'neutral' }) {
  const typeColorMap: Record<string, number> = {
    success: 0x2ECC71,
    error: 0xE74C3C,
    info: 0x5865F2,
    warn: 0xFFA500,
    neutral: 0x2F3136
  }

  return createEmbed({
    title: opts.title,
    description: opts.description,
    color: opts.color ?? (opts.type ? typeColorMap[opts.type] : undefined),
    fields: opts.fields,
    footer: opts.footer,
    footerIcon: opts.footerIconUrl
  })
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
      embed.data?.thumbnail?.url?.startsWith?.('attachment://') ||
      embed.data?.image?.url?.startsWith?.('attachment://')
    )
  )

  if (!wantsAttachment) return interaction.reply(options)

  const files = options.files || []
  if (!files.some((f: any) => f.attachment === branding.path || f.name === branding.name)) {
    files.push({ attachment: branding.path, name: branding.name })
  }

  return interaction.reply({ ...options, files })
}

export async function sendPublicOrSecret(interaction: ChatInputCommandInteraction, embed: EmbedBuilder, secret = false) {
  if (secret) {
    if (!interaction.deferred && !interaction.replied) {
      return _maybeAttachAndReply(interaction, { embeds: [embed], flags: 64 })
    } else {
      const branding = getBrandingAttachment()
      const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
      const payload: any = { embeds: [embed], flags: 64 }
      if (branding && wantsAttachment) {
        payload.files = [{ attachment: branding.path, name: branding.name }]
      }
      return interaction.followUp(payload)
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
        const wantsAttachment = Boolean(embed.data?.footer?.icon_url?.startsWith?.('attachment://'))
        const payload: any = { embeds: [embed], flags: 64 }
        if (branding && wantsAttachment) payload.files = [{ attachment: branding.path, name: branding.name }]
        return interaction.followUp(payload)
      }
    }

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
