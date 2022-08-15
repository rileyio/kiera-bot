import { EmbedBuilder } from 'discord.js'
import { RoutedInteraction } from '@/router'

export async function checkForUpdates(routed: RoutedInteraction) {
  const plugins = routed.bot.Plugin.pluginsActive
  let description = ''

  // Trigger check for updates
  await routed.bot.Plugin.checkForUpdates()

  // Create reply info
  plugins.forEach((p, i) => {
    if (i > 0) description += '\n'
    description += `🧩 **Plugin:** \`${p.name}\``
    description += `\n🔷 **Current Version:** \`${p.version}\``
    if (p.updateAvailable) description += `\n⬆️ **Update Available:** \`${p.updateVersion}\``
    description += '\n'
  })

  return await routed.reply({ embeds: [new EmbedBuilder().setTitle('Plugin and Updates').setDescription(description)] }, true)
}
