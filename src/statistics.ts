import { Bot } from '@/index'
import { ServerStatisticType, ServerStatistic, StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

export class Statistics {
  private Bot: Bot

  constructor(bot: Bot) {
    this.Bot = bot
  }

  public trackServerStatistic(serverID: string, channelID: string, userID: string, type: ServerStatisticType) {
    if (process.env.BOT_BLOCK_STATS === 'true') return // block stats saving
    ;(async () => {
      try {
        // Check Stats Settings if server is tracking & if the user has stats turned off
        const statsSettings = await this.Bot.DB.getMultiple<StatisticsSetting>('stats-settings', {
          $or: [
            { setting: StatisticsSettingType.ServerDisableStats, serverID },
            { setting: StatisticsSettingType.ChannelDisableStats, channelID },
            { setting: StatisticsSettingType.UserDisableStats, userID }
          ]
        })

        if (statsSettings.length > 0) {
          console.log('Blocking Stats Tracking Triggered')
          return
        } // Stop Here, Don't record any stats

        // Track Stat
        await this.Bot.DB.add(
          'stats-servers',
          new ServerStatistic({
            serverID,
            channelID,
            userID,
            type
          })
        )
        // console.log('Stat Logged')
      } catch (error) {
        console.error('Stat Logging Error!')
      }
    })()
  }
}
