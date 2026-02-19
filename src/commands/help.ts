import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js'
import { makeEmbed, replyEmbed } from '../functions/respond'

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Affiche la liste des commandes ou les détails d\'une commande')
  .addStringOption(opt => opt.setName('commande').setDescription('Nom de la commande (optionnel)'))

export async function execute(interaction: ChatInputCommandInteraction, client: Client) {
  console.log(`[cmd:help] /help by ${interaction.user?.tag || interaction.user?.id} guild=${interaction.guild?.id || 'DM'}`)
  const query = interaction.options.getString('commande')

  if (query) {
    const cmd = (client as any).commands.get(query)
    if (!cmd) {
      return interaction.reply({ content: "Commande introuvable.", flags: 64 })
    }

    const json = cmd.data?.toJSON ? cmd.data.toJSON() : cmd.data
    const opts = (json.options || []).map((o: any) => `• \/${json.name} ${o.required ? `**${o.name}**` : o.name} — ${o.description}`).join('\n')
    const embed = makeEmbed({
      title: `/${json.name}`,
      description: json.description || '—',
      fields: opts ? [{ name: 'Options', value: opts }] : undefined
    })
    return replyEmbed(interaction, embed)
  }

  // list all commands
  const lines: string[] = []
  ;(client as any).commands.forEach((c: any) => {
    const json = c.data?.toJSON ? c.data.toJSON() : c.data
    lines.push(`• /${json.name} — ${json.description || '—'}`)
  })

  const embed = makeEmbed({ title: 'Commandes disponibles', description: lines.join('\n'), type: 'info' })
  await replyEmbed(interaction, embed)
}
