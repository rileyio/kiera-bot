import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType, ServerStatisticType } from '@/objects/statistics'
import { CollectorFilter, Message, TextChannel } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Stats',
    controller: disableServerStats,
    example: '{{prefix}}stats disable server',
    name: 'stats-disable-server',
    validate: '/stats:string/disable:string/server:string',
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      serverAdminOnly: true,
      restricted: false
    }
  },
  {
    type: 'message',
    category: 'Stats',
    controller: enableServerStats,
    example: '{{prefix}}stats enable server',
    name: 'stats-enable-server',
    validate: '/stats:string/enable:string/server:string',
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      serverAdminOnly: true,
      restricted: false
    }
  },
  {
    type: 'message',
    category: 'Stats',
    controller: deleteServerStats,
    example: '{{prefix}}stats delete server',
    name: 'stats-delete-server',
    validate: '/stats:string/delete:string/server:string',
    permissions: {
      defaultEnabled: true,
      serverOnly: true,
      serverAdminOnly: true,
      restricted: false
    }
  }
)

export async function disableServerStats(routed: RouterRouted) {
  // Delete any existing record
  await routed.bot.DB.remove<StatisticsSetting>(
    'stats-settings',
    {
      serverID: routed.message.guild.id,
      $or: [{ setting: StatisticsSettingType.ServerDisableStats }, { setting: StatisticsSettingType.ServerEnableStats }]
    } as any,
    { deleteOne: false }
  )

  // Update live stats whitelist
  routed.bot.Statistics.unWhitelistServer(routed.message.guild.id)

  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      serverID: routed.message.guild.id,
      userID: routed.author.id,
      setting: StatisticsSettingType.ServerDisableStats
    })
  )

  await routed.message.reply(routed.$render('Stats.Server.Disabled'))
  return true
}

export async function enableServerStats(routed: RouterRouted) {
  // Delete any existing record
  await routed.bot.DB.remove<StatisticsSetting>(
    'stats-settings',
    {
      serverID: routed.message.guild.id,
      $or: [{ setting: StatisticsSettingType.ServerDisableStats }, { setting: StatisticsSettingType.ServerEnableStats }]
    } as any,
    { deleteOne: false }
  )

  // Update live stats whitelist
  routed.bot.Statistics.whitelistServer(routed.message.guild.id)

  // Add new enabled record
  await routed.bot.DB.add<StatisticsSetting>('stats-settings', {
    serverID: routed.message.guild.id,
    userID: routed.message.author.id,
    setting: StatisticsSettingType.ServerEnableStats
  })

  await routed.message.reply(routed.$render('Stats.Server.Enabled'))
  return true
}

export async function deleteServerStats(routed: RouterRouted) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { serverID: routed.message.guild.id })

  if (count > 0) {
    await routed.message.reply(routed.$render('Stats.Server.DeletionConfirm'))

    try {
      // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
      const filter: CollectorFilter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.author.id
      // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
      const collected = await routed.message.channel.awaitMessages(filter, { max: 1, time: 60000, errors: ['time'] })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, collected.first().id)
      // Upon valid message collection, begin deletion - notify user
      const pleaseWaitMessage = (await routed.message.reply(routed.$render('Stats.Server.DeletionConfirmReceived'))) as Message
      // Delete from DB
      const removed = await routed.bot.DB.remove('stats-servers', { serverID: routed.message.guild.id }, { deleteOne: false })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel as TextChannel, pleaseWaitMessage.id)
      await routed.message.reply(routed.$render('Stats.Server.DeletionDeleted', { count: removed }))
    } catch (error) {
      await routed.message.channel.send(routed.$render('Stats.Server.DeletionCancelled'))
    }
  }
  // Nothing to delete - notify caller
  else await routed.message.reply(routed.$render('Stats.Server.DeletionCancelled'))

  return true
}
