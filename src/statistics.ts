import { ServerStatistic, ServerStatisticType, StatisticsSettingType } from '#objects/statistics'

import { Bot } from '#/index'

export class Statistics {
  private Bot: Bot
  private whitelistedServers: Array<string> = []

  constructor(bot: Bot) {
    this.Bot = bot

    // Load Servers whitelist into memory to save processing time looking up each time
    ;(async () => {
      this.Bot.Log.Bot.verbose('loading stats settings from DB')
      const loaded = await this.Bot.DB.getMultiple('stats-settings', {
        setting: StatisticsSettingType.ServerEnableStats
      })

      this.whitelistedServers = loaded.map((s) => s.serverID)
    })()
  }

  private isWhitelistedServer(value: string) {
    return this.whitelistedServers.findIndex((ws) => ws === value) > -1
  }

  public whitelistServer(value: string) {
    this.whitelistedServers.push(value)
    this.Bot.Log.Bot.debug('after whitelist', this.whitelistedServers)
  }

  public unWhitelistServer(value: string) {
    this.whitelistedServers.splice(
      this.whitelistedServers.findIndex((ws) => ws === value),
      1
    )

    this.Bot.Log.Bot.debug('after unwhitelist', this.whitelistedServers)
  }

  public trackServerStatistic(serverID: string, channelID: string, userID: string, type: ServerStatisticType) {
    // Env setting - Block stats saving
    if (process.env.BOT_BLOCK_STATS === 'true') return

    // console.log('test:', this.whitelistedServers, this.isWhitelistedServer(serverID))

    // Check if server is whitelisted, if not, block stats tracking
    if (!this.isWhitelistedServer(serverID)) return
    ;(async () => {
      try {
        // Check Stats Settings if server is tracking & if the user has stats turned off
        const statsSettings = await this.Bot.DB.getMultiple('stats-settings', {
          $or: [
            { serverID, setting: StatisticsSettingType.ServerDisableStats },
            { channelID, setting: StatisticsSettingType.ChannelDisableStats },
            { setting: StatisticsSettingType.UserDisableStats, userID }
          ]
        })

        if (statsSettings.length > 0) {
          this.Bot.Log.Bot.debug('Blocking Stats Tracking Triggered')
          return
        } // Stop Here, Don't record any stats

        // Track Stat
        await this.Bot.DB.add(
          'stats-servers',
          new ServerStatistic({
            channelID,
            serverID,
            type,
            userID
          })
        )
        // console.log('Stat Logged')
      } catch (error) {
        this.Bot.Log.Bot.error('Stat Logging Error!')
      }
    })()
  }
}
