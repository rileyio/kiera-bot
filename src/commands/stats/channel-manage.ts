import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

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

// export async function deleteChannelStats(routed: RouterRouted) {

// }
