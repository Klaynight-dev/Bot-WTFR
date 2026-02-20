import { EmbedBuilder, ColorResolvable } from 'discord.js'

export const Colors = {
  Primary: 0x5865F2, // Discord Blurple
  Success: 0x2ECC71, // Green
  Error: 0xE74C3C,   // Red
  Info: 0x3498DB,    // Blue
  Warning: 0xF1C40F, // Yellow
  Neutral: 0x2F3136  // Dark Gray
}

export const Emojis = {
  Success: '✅',
  Error: '❌',
  Info: 'ℹ️',
  Warning: '⚠️',
  Loading: '⏳'
}

export interface EmbedOptions {
  title?: string
  description?: string
  color?: ColorResolvable
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: string
  footerIcon?: string
  author?: { name: string; iconURL?: string; url?: string }
  image?: string
  thumbnail?: string
  timestamp?: boolean | Date
}

export function createEmbed(options: EmbedOptions): EmbedBuilder {
  const embed = new EmbedBuilder()

  if (options.title) embed.setTitle(options.title)
  if (options.description) embed.setDescription(options.description)
  if (options.color) embed.setColor(options.color)
  else embed.setColor(Colors.Primary)

  if (options.fields) embed.addFields(options.fields)

  // Standard Footer
  const brandingText = 'Powered by WarBot FR'
  const text = options.footer ? `${options.footer} • ${brandingText}` : brandingText
  embed.setFooter({ text, iconURL: options.footerIcon })

  if (options.author) embed.setAuthor(options.author)
  if (options.image) embed.setImage(options.image)
  if (options.thumbnail) embed.setThumbnail(options.thumbnail)
  
  if (options.timestamp === true) embed.setTimestamp()
  else if (options.timestamp instanceof Date) embed.setTimestamp(options.timestamp)

  return embed
}

export function createErrorEmbed(message: string): EmbedBuilder {
  return createEmbed({
    title: `${Emojis.Error} Erreur`,
    description: message,
    color: Colors.Error
  })
}

export function createSuccessEmbed(message: string): EmbedBuilder {
  return createEmbed({
    title: `${Emojis.Success} Succès`,
    description: message,
    color: Colors.Success
  })
}
