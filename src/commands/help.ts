import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'

import { TrackedServerSetting } from '@/objects/server-setting'

export const Routes = ExportRoutes({
  category: 'Info',
  controller: genericFallback,
  description: 'Help.Help.General.Description',
  example: '{{prefix}}help',
  name: 'help',
  permissions: {
    serverOnly: false
  },
  type: 'message',
  validate: '/help:string'
})

export async function genericFallback(routed: RouterRouted) {
  // Check ChastiKey enabled state in db
  const ckEnabledState =
    routed.message.channel.type === 'DM'
      ? { state: true, value: false }
      : new TrackedServerSetting(
          await routed.bot.DB.get('server-settings', {
            key: 'server.chastikey.enabled',
            serverID: routed.message.guild.id,
            state: true
          })
        )

  // Create HelpBlock from all indivisual command strings
  let helpBlock = Utils.en.help.main + '\n'
  helpBlock += Utils.en.help.mainRegister + '\n'
  helpBlock += Utils.en.help.main8Ball + '\n'
  helpBlock += Utils.en.help.mainAdmin + '\n'
  helpBlock += Utils.en.help.mainBNet + '\n'
  if (ckEnabledState.value === true && ckEnabledState.state === true) helpBlock += Utils.en.help.mainCK + '\n'
  helpBlock += Utils.en.help.mainDecision + '\n'
  helpBlock += Utils.en.help.mainFlip + '\n'
  helpBlock += Utils.en.help.mainPoll + '\n'
  helpBlock += Utils.en.help.mainRoll + '\n'
  helpBlock += Utils.en.help.mainStats + '\n'

  await routed.message.reply({
    embeds: [
      {
        color: 9125611,
        description: routed.$sb(helpBlock),
        footer: {
          iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
          text: `Generated from the current version ${routed.bot.version}`
        },
        title: `**Commands** *(Note: Some may not be server enabled)*`
      }
    ]
  })
  return true
}

export async function commandHelp(routed: RouterRouted) {
  // Check ChastiKey enabled state in db
  const ckEnabledState =
    routed.message.channel.type === 'DM'
      ? { state: true, value: false }
      : new TrackedServerSetting(
          await routed.bot.DB.get('server-settings', {
            key: 'server.chastikey.enabled',
            serverID: routed.message.guild.id,
            state: true
          })
        )

  // If command is for ChastiKey, block it if thats disabled
  if ((routed.v.o.command === 'ck' && ckEnabledState.value === false) || ckEnabledState.state === false) return // Stop here

  // Determine if there's a route,if not inform the user
  if (Utils.en.help[routed.v.o.command]) {
    await routed.message.reply({
      embeds: [
        {
          color: 9125611,
          description: routed.$sb(Utils.en.help[routed.v.o.command]),
          footer: {
            iconURL: 'https://cdn.discordapp.com/app-icons/526039977247899649/41251d23f9bea07f51e895bc3c5c0b6d.png',
            text: `Generated from the current version ${routed.bot.version}`
          },
          title: routed.$sb(`**\`{{prefix}}${routed.v.o.command}\` Command Usage**`)
        }
      ]
    })
  } else {
    await routed.message.reply(routed.$render('Generic.Error.HelpCommandMissing'))
  }

  return true
}
