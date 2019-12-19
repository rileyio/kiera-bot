import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

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
