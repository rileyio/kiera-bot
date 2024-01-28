import { AcceptedResponse, ExportRoutes, RouteConfiguration, Routed } from '#router/index'

import { SlashCommandBuilder } from '@discordjs/builders'

export const Routes = ExportRoutes(
  new RouteConfiguration({
    category: 'Info',
    controller: versionCheck,
    description: 'Help.Admin.BotVersion.Description',
    name: 'version',
    permissions: {
      serverOnly: false
    },
    slash: new SlashCommandBuilder().setName('version').setDescription('Display current Kiera version'),
    type: 'discord-chat-interaction'
  })
)

/**
 * Gets the bot's current `package.json` version string
 * @export
 * @param {Routed} routed
 */
async function versionCheck(routed: Routed<'discord-chat-interaction'>): AcceptedResponse {
  await routed.reply(`Running on version \`${routed.bot.version}\``)
  // await routed.bot.Router.removeRoute('rio')

  return
}
