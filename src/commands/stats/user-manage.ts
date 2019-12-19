import { RouterRouted, ExportRoutes } from '@/router'
import { StatisticsSetting, StatisticsSettingType, ServerStatisticType } from '@/objects/statistics'

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

  await routed.message.reply(
    'All stats have now been **Disabled** for your account (across all servers where Kiera is present).\n\n  - If you wish to delete all recorded stats to date (command coming soon!) please reachout via the Kiera Bot Dev Server.\n  - Disabling alone stops new logging going forward only.'
  )
  return true
}

export async function enableUserStats(routed: RouterRouted) {
  const removed = await routed.bot.DB.remove<StatisticsSetting>('stats-settings', {
    userID: routed.user.id,
    setting: StatisticsSettingType.UserDisableStats
  })

  if (removed > 0) await routed.message.reply('Stats are now **Enabled** for your account (across all servers where Kiera is present).')
  return true
}
