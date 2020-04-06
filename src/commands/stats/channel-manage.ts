import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType, ServerStatistic } from '@/objects/statistics'
import { CollectorFilter, Message, Util, TextChannel } from 'discord.js'

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

  await routed.message.reply(Utils.sb(Utils.en.stats.channelStatsDisabled))
  return true
}

export async function enableChannelStats(routed: RouterRouted) {
  const removed = await routed.bot.DB.remove<StatisticsSetting>('stats-settings', {
    serverID: routed.message.guild.id,
    userID: routed.user.id,
    channelID: routed.message.channel.id,
    setting: StatisticsSettingType.ChannelDisableStats
  })

  if (removed > 0) await routed.message.reply(Utils.sb(Utils.en.stats.channelStatsEnabled))
  return true
}

export async function deleteChannelStats(routed: RouterRouted) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { serverID: routed.message.guild.id })

  if (count > 0) {
    await routed.message.reply(Utils.sb(Utils.en.stats.channelStatsDeletionConfirm))

    try {
      // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
      const filter: CollectorFilter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.user.id
      // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
      const collected = await routed.message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, collected.first().id)
      // Upon valid message collection, begin deletion - notify user
      const pleaseWaitMessage = (await routed.message.reply(Utils.sb(Utils.en.stats.channelStatsDeletionConfirmReceived))) as Message
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
      await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, pleaseWaitMessage.id)
      await routed.message.reply(Utils.sb(Utils.en.stats.channelStatsDeletionDeleted, { count: removed }))
    } catch (error) {
      await routed.message.channel.send(Utils.sb(Utils.en.stats.channelStatsDeletionCancelled))
    }
  }
  // Nothing to delete - notify caller
  else await routed.message.reply(Utils.sb(Utils.en.stats.channelStatsDeletionNoStats))
  return true
}
