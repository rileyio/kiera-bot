import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { TrackedAvailableObject } from '@/objects/available-objects'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Info',
    controller: commandHelp,
    example: '{{prefix}}help poll',
    name: 'help-command',
    validate: '/help:string/command=string',
    permissions: { serverOnly: false }
  },
  {
    type: 'message',
    category: 'Info',
    controller: genericFallback,
    description: 'Help.Help.General.Description',
    example: '{{prefix}}help',
    name: 'help',
    validate: '/help:string',
    permissions: { serverOnly: false }
  }
)

export async function genericFallback(routed: RouterRouted) {
  // Check ChastiKey enabled state in db
  var ckEnabledState = (await routed.bot.DB.get<TrackedAvailableObject>('server-settings', {
    serverID: routed.message.guild.id,
    key: 'server.chastikey.enabled',
    state: true
  })) || { value: false, state: true }

  // Create HelpBlock from all indivisual command strings
  var helpBlock = Utils.en.help.main + '\n'
  helpBlock += Utils.en.help.mainRegister + '\n'
  helpBlock += Utils.en.help.main8Ball + '\n'
  helpBlock += Utils.en.help.mainBNet + '\n'
  if (ckEnabledState.value === true && ckEnabledState.state === true) helpBlock += Utils.en.help.mainCK + '\n'
  helpBlock += Utils.en.help.mainDecision + '\n'
  helpBlock += Utils.en.help.mainFlip + '\n'
  helpBlock += Utils.en.help.mainPoll + '\n'
  helpBlock += Utils.en.help.mainRoll + '\n'
  helpBlock += Utils.en.help.mainStats + '\n'

  await routed.message.reply({
    embed: {
      title: `**Commands** *(Note: Some may not be server enabled)*`,
      description: Utils.sb(helpBlock),
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
  // Check ChastiKey enabled state in db
  var ckEnabledState = (await routed.bot.DB.get<TrackedAvailableObject>('server-settings', {
    serverID: routed.message.guild.id,
    key: 'server.chastikey.enabled',
    state: true
  })) || { value: false, state: true }

  // If command is for ChastiKey, block it if thats disabled
  if ((routed.v.o.command === 'ck' && ckEnabledState.value === false) || ckEnabledState.state === false) return // Stop here

  // Determine if there's a route,if not inform the user
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
  } else {
    await routed.message.reply(routed.$render('Generic.Error.HelpCommandMissing'))
  }

  return true
}
