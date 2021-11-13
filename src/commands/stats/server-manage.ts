import * as Utils from '@/utils'

import { ExportRoutes, RouterRouted } from '@/router'
import { Message, TextChannel } from 'discord.js'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

export const Routes = ExportRoutes(
  {
    category: 'Stats',
    controller: disableServerStats,
    description: 'Help.Stats.DisableServerStats.Description',
    example: '{{prefix}}stats disable server',
    name: 'stats-disable-server',
    permissions: {
      defaultEnabled: true,
      restricted: false,
      serverAdminOnly: true,
      serverOnly: true
    },
    type: 'message',
    validate: '/stats:string/disable:string/server:string'
  },
  {
    category: 'Stats',
    controller: enableServerStats,
    description: 'Help.Stats.EnableServerStats.Description',
    example: '{{prefix}}stats enable server',
    name: 'stats-enable-server',
    permissions: {
      defaultEnabled: true,
      restricted: false,
      serverAdminOnly: true,
      serverOnly: true
    },
    type: 'message',
    validate: '/stats:string/enable:string/server:string'
  },
  {
    category: 'Stats',
    controller: deleteServerStats,
    description: 'Help.Stats.DeleteServerStats.Description',
    example: '{{prefix}}stats delete server',
    name: 'stats-delete-server',
    permissions: {
      defaultEnabled: true,
      restricted: false,
      serverAdminOnly: true,
      serverOnly: true
    },
    type: 'message',
    validate: '/stats:string/delete:string/server:string'
  }
)

export async function disableServerStats(routed: RouterRouted) {
  // Delete any existing record
  await routed.bot.DB.remove(
    'stats-settings',
    {
      $or: [
        {
          setting: StatisticsSettingType.ServerDisableStats
        },
        {
          setting: StatisticsSettingType.ServerEnableStats
        }
      ],
      serverID: routed.message.guild.id
    } as any,
    { deleteOne: false }
  )

  // Update live stats whitelist
  routed.bot.Statistics.unWhitelistServer(routed.message.guild.id)

  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      serverID: routed.message.guild.id,
      setting: StatisticsSettingType.ServerDisableStats,
      userID: routed.author.id
    })
  )

  await routed.message.reply(routed.$render('Stats.Server.Disabled'))
  return true
}

export async function enableServerStats(routed: RouterRouted) {
  // Delete any existing record
  await routed.bot.DB.remove(
    'stats-settings',
    {
      $or: [
        {
          setting: StatisticsSettingType.ServerDisableStats
        },
        {
          setting: StatisticsSettingType.ServerEnableStats
        }
      ],
      serverID: routed.message.guild.id
    } as any,
    { deleteOne: false }
  )

  // Update live stats whitelist
  routed.bot.Statistics.whitelistServer(routed.message.guild.id)

  // Add new enabled record
  await routed.bot.DB.add('stats-settings', {
    serverID: routed.message.guild.id,
    setting: StatisticsSettingType.ServerEnableStats,
    userID: routed.message.author.id
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
      const filter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.author.id
      // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
      const collected = await routed.message.channel.awaitMessages({ errors: ['time'], filter, max: 1, time: 60000 })
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
