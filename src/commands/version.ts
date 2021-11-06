import { ExportRoutes, RoutedInteraction } from '@/router'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes({
  category: 'Info',
  controller: versionCheck,
  description: 'Help.Admin.BotVersion.Description',
  name: 'admin-version',
  permissions: {
    serverOnly: false
  },
  slash: new SlashCommandBuilder().setName('version').setDescription('Display current Kiera version'),
  type: 'interaction'
})

/**
 * Gets the bot's current `package.json` version string
 * @export
 * @param {RoutedInteraction} routed
 */
function versionCheck(routed: RoutedInteraction) {
  return routed.reply(`Running on version \`${routed.bot.version}\``)
}
