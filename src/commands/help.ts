import * as Utils from '../utils/'
import { RouterRouted } from '../router/router';
import { ExportRoutes } from '../router/routes-exporter';

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Info',
    commandTarget: 'author',
    controller: commandHelp,
    example: '{{prefix}}help ck',
    name: 'help-command',
    validate: '/help:string/command=string'
  },
  {
    type: 'message',
    category: 'Info',
    commandTarget: 'author',
    controller: genericFallback,
    example: '{{prefix}}help',
    name: 'help',
    validate: '/help:string'
  },
)

export async function genericFallback(routed: RouterRouted) {
  await routed.message.reply({
    embed: {
      title: `**Commands Available**`,
      description: Utils.sb(Utils.en.help.main),
      color: 9125611,
      footer: {
        icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
        text: `Generated from the current version ${routed.bot.version}`
      }

    }
  })
  return true
}

export async function commandHelp(routed: RouterRouted) {
  // Determine if there's a route, if not inform the user
  if (Utils.en.help[routed.v.o.command]) {
    await routed.message.reply({
      embed: {
        title: Utils.sb(`**\`{{prefix}}${routed.v.o.command}\` Command Usage**`),
        description: Utils.sb(Utils.en.help[routed.v.o.command]),
        color: 9125611,
        footer: {
          icon_url: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
          text: `Generated from the current version ${routed.bot.version}`
        }

      }
    })
  }
  else {
    await routed.message.reply(Utils.en.error.commandHelpMissing)
  }

  return true
}
