import { RoutedInteraction } from '@/router'
import { StatisticsSettingType } from '@/objects/statistics'

export async function aboutStats(routed: RoutedInteraction) {
  // Get states
  const serverStatsEnabled = await routed.bot.DB.verify('stats-settings', {
    serverID: routed.guild.id,
    setting: StatisticsSettingType.ServerEnableStats
  })

  const statsDisabledUser = await routed.bot.DB.verify('stats-settings', {
    setting: StatisticsSettingType.UserDisableStats,
    userID: routed.author.id
  })

  // Get user total stats count
  const statsCount = await routed.bot.DB.count('stats-servers', { userID: routed.author.id })

  return await routed.reply(
    routed.$render('Stats.Info.About', {
      count: statsCount,
      serverState: serverStatsEnabled ? 'Enabled' : 'Disabled',
      userState: statsDisabledUser ? 'Disabled' : 'Enabled'
    }),
    true
  )
}
