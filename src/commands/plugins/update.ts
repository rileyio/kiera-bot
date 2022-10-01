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

export async function update(routed: RoutedInteraction) {
  const name = routed.options.get('name')?.value as string
  const { plugin } = routed.bot.Plugin.getPlugin(name)

  if (plugin) {
    if (plugin.updateAvailable) {
      await routed.reply(`🧩 Updating \`${plugin.name}@${plugin.version}\` to **\`${plugin.updateVersion}\`**...`, true)
      const status = await routed.bot.Plugin.downloadUpdate(plugin)
      if (!status) return await routed.interaction.followUp({ content: 'Plugin Update Failed!', ephemeral: true })
      return await routed.interaction.followUp({ content: `Update Successful! ${routed.bot.Plugin.getPlugin(plugin.name)?.plugin.version}`, ephemeral: true })
    } else return await routed.reply('Plugin does not have an update available.', true)
  }
  return await routed.reply('Unable to find Plugin.', true)
}
