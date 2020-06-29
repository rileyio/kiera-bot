import { Bot } from '@/index'
import { ServerStatisticType, ServerStatistic, StatisticsSetting, StatisticsSettingType } from '@/objects/statistics'

export class Statistics {
  private Bot: Bot
  private whitelistedServers: Array<string> = []

  constructor(bot: Bot) {
    this.Bot = bot

    // Load Servers whitelist into memory to save processing time looking up each time
    ;(async () => {
      console.log('loading stats settings from DB')
      const loaded = await this.Bot.DB.getMultiple<StatisticsSetting>('stats-settings', {
        setting: StatisticsSettingType.ServerEnableStats
      })

      this.whitelistedServers = loaded.map((s) => s.serverID)
      console.log(this.whitelistedServers)
    })()
  }

  private isWhitelistedServer(value: string) {
    return this.whitelistedServers.findIndex((ws) => ws === value) > -1
  }

  public whitelistServer(value: string) {
    this.whitelistedServers.push(value)
    console.log('after whitelist', this.whitelistedServers)
  }

  public unWhitelistServer(value: string) {
    this.whitelistedServers.splice(
      this.whitelistedServers.findIndex((ws) => ws === value),
      1
    )

    console.log('after unwhitelist', this.whitelistedServers)
  }

  public trackServerStatistic(serverID: string, channelID: string, userID: string, type: ServerStatisticType) {
    // Env setting - Block stats saving
    if (process.env.BOT_BLOCK_STATS === 'true') return

    console.log('test:', this.whitelistedServers, this.isWhitelistedServer(serverID))

    // Check if server is whitelisted, if not, block stats tracking
    if (!this.isWhitelistedServer(serverID)) return
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
