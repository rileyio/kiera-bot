import { ExportRoutes, RoutedInteraction } from '@/router'
import { StatisticsSetting, StatisticsSettingType, ServerStatistic } from '@/objects/statistics'

export async function aboutStats(routed: RoutedInteraction) {
  // Get states
  const serverStatsEnabled = await routed.bot.DB.verify<StatisticsSetting>('stats-settings', {
    serverID: routed.guild.id,
    setting: StatisticsSettingType.ServerEnableStats
  })

  const statsDisabledUser = await routed.bot.DB.verify<StatisticsSetting>('stats-settings', { userID: routed.author.id, setting: StatisticsSettingType.UserDisableStats })

  // Get user total stats count
  const statsCount = await routed.bot.DB.count<ServerStatistic>('stats-servers', { userID: routed.author.id })

  return await routed.reply(
    routed.$render('Stats.Info.About', {
      serverState: serverStatsEnabled ? 'Enabled' : 'Disabled',
      userState: statsDisabledUser ? 'Disabled' : 'Enabled',
      count: statsCount
    }),
    true
  )
}
