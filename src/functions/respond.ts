import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'

export function makeEmbed(opts: { title?: string; description?: string; color?: number; fields?: { name: string; value: string; inline?: boolean }[] }) {
  const embed = new EmbedBuilder()
  if (opts.title) embed.setTitle(opts.title)
  if (opts.description) embed.setDescription(opts.description)
  embed.setColor(opts.color ?? 0x5865F2)
  if (opts.fields) embed.addFields(...opts.fields)
  embed.setTimestamp()
  return embed
}

export async function sendPublicOrSecret(interaction: ChatInputCommandInteraction, embed: EmbedBuilder, secret = false) {
  if (secret) {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ embeds: [embed], ephemeral: true })
    } else {
      await interaction.followUp({ embeds: [embed], ephemeral: true })
    }
    return
  }

  const ch: any = interaction.channel
  if (ch && typeof ch.send === 'function') {
    try {
      await ch.send({ embeds: [embed] })
    } catch (err) {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.reply({ embeds: [embed], ephemeral: true })
      } else {
        await interaction.followUp({ embeds: [embed], ephemeral: true })
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

  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply({ embeds: [embed], ephemeral: true })
  } else {
    await interaction.followUp({ embeds: [embed], ephemeral: true })
  }
}

export async function replyEphemeralEmbed(interaction: ChatInputCommandInteraction, embed: EmbedBuilder) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply({ embeds: [embed], ephemeral: true })
  } else {
    await interaction.followUp({ embeds: [embed], ephemeral: true })
  }
}
