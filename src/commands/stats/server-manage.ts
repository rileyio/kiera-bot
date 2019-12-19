import * as Utils from '@/utils'
import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'
import { CollectorFilter, Message } from 'discord.js'

export const Routes = ExportRoutes(
  {
    type: 'message',
    category: 'Stats',
    commandTarget: 'none',
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
    commandTarget: 'none',
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
    commandTarget: 'none',
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
  await routed.bot.DB.add(
    'stats-settings',
    new StatisticsSetting({
      serverID: routed.message.guild.id,
      userID: routed.user.id,
      setting: StatisticsSettingType.ServerDisableStats
    })
  )

  await routed.message.reply(
    'All stats have now been **Disabled** for this server.\n\n  - If you wish to delete all recorded stats to date (command coming soon!) please reachout via the Kiera Bot Dev Server.\n  - Disabling alone stops new logging going forward only.'
  )
  return true
}

export async function enableServerStats(routed: RouterRouted) {
  const removed = await routed.bot.DB.remove<StatisticsSetting>('stats-settings', {
    serverID: routed.message.guild.id,
    setting: StatisticsSettingType.ServerDisableStats
  })

  if (removed > 0) await routed.message.reply('Stats are now **Enabled** for this server.')
  return true
}

export async function deleteServerStats(routed: RouterRouted) {
  // First check if there's even anything to delete
  const count = await routed.bot.DB.count('stats-servers', { serverID: routed.message.guild.id })

  if (count > 0) {
    await routed.message.reply('To confirm deleting all stats pertaining to this server, send **`yes`** in the next 60 seconds!')

    try {
      // Filter to watch for the correct user & text to be sent (+ remove any whitespace)
      const filter: CollectorFilter = (response: Message) => response.content.toLowerCase().replace(' ', '') === 'yes' && response.author.id === routed.user.id
      // Message collector w/Filter - Wait up to a max of 1 min for exactly 1 reply from the required user
      const collected = await routed.message.channel.awaitMessages(filter, { maxMatches: 1, time: 60000, errors: ['time'] })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel, collected.first().id)
      // Upon valid message collection, begin deletion - notify user
      const pleaseWaitMessage = (await routed.message.reply('Confirmation Received! Server Stats Deletion in progress... please wait')) as Message
      // Delete from DB
      const removed = await routed.bot.DB.remove('stats-servers', { serverID: routed.message.guild.id }, { deleteOne: false })
      // Delete the previous message at this stage
      await Utils.Channel.deleteMessage(routed.message.channel, pleaseWaitMessage.id)
      await routed.message.reply(`Stats \`(count: ${removed})\` for this server have been deleted!`)
    } catch (error) {
      await routed.message.channel.send(`Server Stats Deletion Cancelled! Reply not received before timeout (1 minute).`)
    }
  }
  // Nothing to delete - notify caller
  else await routed.message.reply(`There are no stats stored for this server!`)

  return true
}
