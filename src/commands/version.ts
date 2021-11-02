import { SlashCommandBuilder } from '@discordjs/builders'
import { RouterRouted, ExportRoutes } from '@/router'

export const Routes = ExportRoutes({
  type: 'message',
  category: 'Info',
  controller: versionCheck,
  description: 'Help.Admin.BotVersion.Description',
  example: '{{prefix}}version',
  name: 'admin-version',
  slash: new SlashCommandBuilder().setName('version').setDescription('Display current Kiera version'),
  validate: '/version:string',
  permissions: { serverOnly: false }
})

/**
 * Gets the bot's current `package.json` version string
 * @export
 * @param {RouterRouted} routed
 */
function versionCheck(routed: RouterRouted) {
  return routed.reply(`Running on version \`${routed.bot.version}\``)
}
