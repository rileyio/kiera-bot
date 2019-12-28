import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType, ServerStatisticType, ServerStatistic } from '@/objects/statistics'
import { CollectorFilter, Message } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: diableUserStats,
    example: '{{prefix}}stats disable user',
    name: 'stats-disable-user',
    validate: '/stats:string/disable:string/user:string',
    permissions: {
      defaultEnabled: true,
      restricted: false
    }
  },
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: enableUserStats,
    example: '{{prefix}}stats enable user',
    name: 'stats-enable-user',
    validate: '/stats:string/enable:string/user:string',
    permissions: {
      defaultEnabled: true,
      restricted: false
    }
  },
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: deleteUserStats,
    example: '{{prefix}}stats delete user',
    name: 'stats-delete-user',
    validate: '/stats:string/delete:string/user:string',
    permissions: {
      defaultEnabled: true,
      restricted: false
    }
  }
)

export async function diableUserStats(routed: RouterRouted) {
  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      userID: routed.user.id,
      setting: StatisticsSettingType.UserDisableStats
    })
  )

  await routed.message.reply(Utils.sb(Utils.en.stats.userStatsNowDisabled))
  return true
}

export async function enableUserStats(routed: RouterRouted) {
  const removed = await routed.bot.DB.remove<StatisticsSetting>('stats-settings', {
    userID: routed.user.id,
    setting: StatisticsSettingType.UserDisableStats
  })

  if (removed > 0) await routed.message.reply(Utils.sb(Utils.en.stats.userStatsNowEnabled))
  return true
}

export async function deleteUserStats(routed: RouterRouted) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { userID: routed.user.id })

  if (count > 0) {
    await routed.message.reply('To confirm deleting all stats pertaining to your account, send **`yes`** in the next 60 seconds!')

    try {
      // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
      const filter: CollectorFilter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.user.id
      // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
      const collected = await routed.message.channel.awaitMessages(filter, { maxMatches: 1, time: 60000, errors: ['time'] })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel, collected.first().id)
      // Upon valid message collection, begin deletion - notify user
      const pleaseWaitMessage = (await routed.message.reply('Confirmation Received! Your Stats Deletion in progress... please wait')) as Message
      // Delete from DB
      const removed = await routed.bot.DB.remove<ServerStatistic>(
        'stats-servers',
        {
          userID: routed.user.id
        },
        { deleteOne: false }
      )
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel, pleaseWaitMessage.id)
      await routed.message.reply(`Stats \`(count: ${removed})\` for your account have been deleted!`)
    } catch (error) {
      await routed.message.channel.send(`Your account Stats Deletion Cancelled! Reply not received before timeout (1 minute).`)
    }
  }
  // Nothing to delete - notify caller
  else await routed.message.reply(`There are no stats stored for your account!`)
  return true
}
