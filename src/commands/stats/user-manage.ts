import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'
import { Message, TextChannel } from 'discord.js'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

import { promptUserConfirm } from '@/utils/prompt'

export const Routes = ExportRoutes(
  {
    category: 'Stats',
    controller: diableUserStats,
    description: 'Help.Stats.DisableUserStats.Description',
    example: '{{prefix}}stats disable user',
    name: 'stats-disable-user',
    permissions: {
      defaultEnabled: true,
      restricted: false
    },
    type: 'message',
    validate: '/stats:string/disable:string/user:string'
  },
  {
    category: 'Stats',
    controller: enableUserStats,
    description: 'Help.Stats.EnableUserStats.Description',
    example: '{{prefix}}stats enable user',
    name: 'stats-enable-user',
    permissions: {
      defaultEnabled: true,
      restricted: false
    },
    type: 'message',
    validate: '/stats:string/enable:string/user:string'
  },
  {
    category: 'Stats',
    controller: deleteUserStats,
    description: 'Help.Stats.DeleteUserStats.Description',
    example: '{{prefix}}stats delete user',
    name: 'stats-delete-user',
    permissions: {
      defaultEnabled: true,
      restricted: false
    },
    type: 'message',
    validate: '/stats:string/delete:string/user:string'
  }
)

export async function diableUserStats(routed: RouterRouted) {
  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      setting: StatisticsSettingType.UserDisableStats,
      userID: routed.author.id
    })
  )

  await routed.message.reply(routed.$render('Stats.User.StatsDisabled'))
  return true
}

export async function enableUserStats(routed: RouterRouted) {
  const removed = await routed.bot.DB.remove('stats-settings', {
    setting: StatisticsSettingType.UserDisableStats,
    userID: routed.author.id
  })

  if (removed > 0) await routed.message.reply(routed.$render('Stats.User.StatsEnabled'))
  return true
}

export async function deleteUserStats(routed: RouterRouted) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { userID: routed.author.id })

  if (count > 0) {
    const confirmed = await promptUserConfirm(routed, {
      deleteResponseAtEnd: true,
      expectedValidResponse: 'yes',
      firstMessage: 'To confirm deleting all stats pertaining to your account, send **`yes`** in the next 60 seconds!',
      onTimeoutErrorMessage: 'Your account Stats Deletion Cancelled! Reply not received before timeout (1 minute).'
    })

    if (confirmed) {
      // Upon valid message collection, begin deletion - notify user
      const pleaseWaitMessage = (await routed.message.reply('Confirmation Received! Your Stats Deletion in progress... please wait')) as Message
      // Delete from DB
      const removed = await routed.bot.DB.remove(
        'stats-servers',
        {
          userID: routed.author.id
        },
        { deleteOne: false }
      )
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, pleaseWaitMessage.id)
      await routed.message.reply(`Stats \`(count: ${removed})\` for your account have been deleted!`)
      return true // Stop here
    }
  }
  // Nothing to delete - notify caller
  else await routed.message.reply(`There are no stats stored for your account!`)
  return true
}
