import { SlashCommandBuilder, ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js'
import { replyEmbed } from '../functions/respond'
import { createEmbed, createErrorEmbed, Colors, Emojis } from '../utils/style'

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
    const opts = (json.options || []).map((o: any) => `• \`/${json.name} ${o.required ? `<${o.name}>` : `[${o.name}]`}\` — ${o.description}`).join('\n')

    const embed = createEmbed({
      title: `❔ Aide : /${json.name}`,
      description: json.description || 'Pas de description.',
      color: Colors.Info,
      fields: opts ? [{ name: '🛠️ Options', value: opts }] : undefined,
      footer: 'WarBot FR System'
    })
    return replyEmbed(interaction, embed)
  }

  // list all commands
  const lines: string[] = []
  const commands = (client as any).commands

  commands.forEach((c: any) => {
    const json = c.data?.toJSON ? c.data.toJSON() : c.data
    lines.push(`> \`/${json.name}\` — ${json.description || '—'}`)
  })

  const embed = createEmbed({
    title: `📚 Liste des commandes`,
    description: `Voici la liste des commandes disponibles sur le bot.\n\n${lines.join('\n')}`,
    color: Colors.Primary,
    footer: 'Utilise /help <commande> pour plus de détails.'
  })

  await replyEmbed(interaction, embed)
}
