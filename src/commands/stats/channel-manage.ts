import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType, ServerStatistic } from '@/objects/statistics'
import { CollectorFilter, Message } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: disableChannelStats,
    example: '{{prefix}}stats disable channel',
    name: 'stats-disable-channel',
    validate: '/stats:string/disable:string/channel:string',
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      manageChannelReq: true
    }
  },
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: enableChannelStats,
    example: '{{prefix}}stats enable channel',
    name: 'stats-enable-channel',
    validate: '/stats:string/enable:string/channel:string',
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      manageChannelReq: true
    }
  },
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
    controller: deleteChannelStats,
    example: '{{prefix}}stats delete channel',
    name: 'stats-delete-channel',
    validate: '/stats:string/delete:string/channel:string',
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      manageChannelReq: true
    }
  }
)

export async function disableChannelStats(routed: RouterRouted) {
  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      serverID: routed.message.guild.id,
      userID: routed.user.id,
      channelID: routed.message.channel.id,
      setting: StatisticsSettingType.ChannelDisableStats
    })
  )

  await routed.message.reply(
    'All stats have now been **Disabled** for this channel.\n\n  - If you wish to delete all recorded stats to date (command coming soon!) please reachout via the Kiera Bot Dev Server.\n  - Disabling alone stops new logging going forward only.'
  )
  return true
}

export async function enableChannelStats(routed: RouterRouted) {
  const removed = await routed.bot.DB.remove<StatisticsSetting>('stats-settings', {
    serverID: routed.message.guild.id,
    userID: routed.user.id,
    channelID: routed.message.channel.id,
    setting: StatisticsSettingType.ChannelDisableStats
  })

  if (removed > 0) await routed.message.reply('Stats are now **Enabled** for this channel.')
  return true
}

export async function deleteChannelStats(routed: RouterRouted) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { serverID: routed.message.guild.id })

  if (count > 0) {
    await routed.message.reply('To confirm deleting all stats pertaining to this channel, send **`yes`** in the next 60 seconds!')

    try {
      // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
      const filter: CollectorFilter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.user.id
      // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
      const collected = await routed.message.channel.awaitMessages(filter, { maxMatches: 1, time: 60000, errors: ['time'] })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel, collected.first().id)
      // Upon valid message collection, begin deletion - notify user
      const pleaseWaitMessage = (await routed.message.reply('Confirmation Received! Channel Stats Deletion in progress... please wait')) as Message
      // Delete from DB
      const removed = await routed.bot.DB.remove<ServerStatistic>(
        'stats-servers',
        {
          serverID: routed.message.guild.id,
          channelID: routed.message.channel.id
        },
        { deleteOne: false }
      )
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel, pleaseWaitMessage.id)
      await routed.message.reply(`Stats \`(count: ${removed})\` for this channel have been deleted!`)
    } catch (error) {
      await routed.message.channel.send(`Channel Stats Deletion Cancelled! Reply not received before timeout (1 minute).`)
    }
  }
  // Nothing to delete - notify caller
  else await routed.message.reply(`There are no stats stored for this channel!`)
  return true
}
