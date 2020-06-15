import { Bot } from '@/index'
import { BotStatistics, BotStatistic } from './objects/statistics'
import { EventEmitter } from 'events'
import * as Helper from './utils/stats'

export class LiveStatistics extends EventEmitter {
  private uptimeInterval: NodeJS.Timer
  private dbUpdateInterval: NodeJS.Timer
  private Bot: Bot
  public BotStatistics: BotStatistics

  // Ticker states
  private uptimeTickerRunning = false
  private dbUpdateTickerRunning = false

  constructor(bot: Bot) {
    super()
    this.Bot = bot
    this.BotStatistics = new BotStatistics({ version: this.Bot.version })
  }

  public async start() {
    try {
      await this.loadExisting()
      return true
    } catch (error) {
      return false
    }
  }

  public destroy() {
    clearInterval(this.uptimeInterval)
    clearInterval(this.dbUpdateInterval)
  }

  public increment(stat: BotStatistic, valueOverride?: number) {
    switch (stat) {
      case 'discord-api-calls':
        this.BotStatistics.discordAPICalls += 1
        break
      case 'messages-seen':
        this.BotStatistics.messages.seen += 1
        break
      case 'messages-sent':
        this.BotStatistics.messages.sent += 1
        break
      case 'messages-tracked':
        this.BotStatistics.messages.tracked += 1
        break
      case 'commands-routed':
        this.BotStatistics.commands.routed += 1
        break
      case 'commands-completed':
        this.BotStatistics.commands.completed += 1
        break
      case 'commands-invalid':
        this.BotStatistics.commands.invalid += 1
        break
      case 'dms-received':
        this.BotStatistics.dms.received += 1
        break
      case 'dms-sent':
        this.BotStatistics.dms.sent += 1
        break

      default:
        break
    }
  }

  public async loadExisting() {
    // Ensure db records exist
    if (!(await this.Bot.DB.verify('stats-bot', { name: this.BotStatistics.name /* version: this.Bot.version */ }))) {
      await this.Bot.DB.add('stats-bot', this.BotStatistics)
    }

    // Get existing stats from DB
    const botStats = await this.Bot.DB.get<BotStatistics>('stats-bot', {})
    // Init stats
    this.BotStatistics.startup(botStats)

    // Start tickers
    this.uptimeTicker()
    this.dbUpdateTicker()
  }

  private uptimeTicker() {
    // Block from accidently being started twice
    if (!this.uptimeTickerRunning) {
      this.uptimeTickerRunning = true
      this.uptimeInterval = setInterval(() => {
        this.BotStatistics.uptime = Date.now() - this.BotStatistics.startTimestamp
      }, 1000)
    }
  }

  private dbUpdateTicker() {
    // Block from accidently being started twice
    if (!this.dbUpdateTickerRunning) {
      this.dbUpdateTickerRunning = true
      this.dbUpdateInterval = setInterval(async () => {
        if (process.env.BOT_BLOCK_STATS === 'true') return // block stats saving
        await this.updatePeriodicStats()

        await this.Bot.DB.update(
          'stats-bot',
          {
            name: this.BotStatistics.name
            // version: this.Bot.version
          },
          this.BotStatistics
        )
      }, 10000)
    }
  }

  private async updatePeriodicStats() {
    this.BotStatistics.servers = await Helper.fetchGuildStats(this.Bot)
  }
}
