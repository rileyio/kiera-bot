import { Bot } from '@/index'
import { EventEmitter } from 'events'
import { DatabaseMonitor } from './db/monitor'
import { LiveStatistics } from './live-statistics'
import { TextChannel } from 'discord.js'
import { WebAPI } from './api/web-api'

export class BotMonitor extends EventEmitter {
  private announcementsChannel: string = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL
  private Bot: Bot
  private DBMonitor: DatabaseMonitor
  private WebAPI: WebAPI
  public LiveStatistics: LiveStatistics
  public status = {
    discord: false,
    db: false,
    api: false,
    router: false,
    stats: false
  }

  // States
  public unhealthyStartup: boolean
  public unhealthyRecovered: boolean = false
  public unhealthyRecovering: boolean
  public unhealthyRecoveryCount: number = 0

  constructor(bot: Bot) {
    super()

    this.Bot = bot
    this.DBMonitor = new DatabaseMonitor(this.Bot)
    this.LiveStatistics = new LiveStatistics(this.Bot)
    this.WebAPI = new WebAPI(this.Bot)

    this.setEventListeners()
  }

  public async start() {
    this.status.db = await this.DBMonitor.start()
    this.status.discord = await this.discordAPIReady()
    this.status.stats = await this.LiveStatistics.start()
    this.status.api = await this.WebAPI.start()

    // tslint:disable-next-line:no-console
    console.log(`@@@@@ db: ${this.status.db}, stats: ${this.status.stats}, api: ${this.status.api}`)

    if (this.status.db && this.status.stats && this.status.api) this.unhealthyStartup = false
    else this.unhealthyStartup = true

    // Not a complete loss yet, try recovering myself (at least has discord available to alert someone)
    if (this.status.discord && this.unhealthyStartup) await this.helpMe()

    // If completely unhealthy, wait a little and try bouncing the service
    if (!this.status.discord && this.unhealthyStartup) {
      setTimeout(() => {
        process.exit(99)
      }, 5000)
    }
  }

  private setEventListeners() {
    // Setup Event listeners //
    this.DBMonitor.on('dbPingSuccessful', async (time, avg) => {
      const previousDBState = this.status.db
      this.status.db = true
      if (this.unhealthyStartup && !previousDBState) await this.tryUnhealthyRecovery()
    })
    this.DBMonitor.on('dbPingFailed', async (time, avg) => {
      this.status.db = false
      await this.checkPingThreshold()
    })
    this.LiveStatistics.on('statsReady', () => (this.status.stats = true))
    this.LiveStatistics.on('statsNotReady', () => (this.status.stats = false))
  }

  private async tryUnhealthyRecovery() {
    // If recovery threshold is passed, just reboot the bot
    if (this.unhealthyRecoveryCount > 5) {
      // tslint:disable-next-line:no-console
      console.log('⚠️ Killing service in 3 seconds')

      setTimeout(() => {
        process.exit(99)
      }, 3000)

      return
    }

    if (this.unhealthyRecovering) return // block dups
    this.unhealthyRecovering = true
    // tslint:disable-next-line:no-console
    console.log('------ trying an unhealty recovery of services - since most rely on the db')
    // Close the WebAPI if it was listening
    if (this.status.api) this.WebAPI.close()
    // Some will need to be re-initalized
    this.DBMonitor.destroy() // Destroy interval tickers
    this.LiveStatistics.destroy() // Destroy interval tickers
    this.DBMonitor = new DatabaseMonitor(this.Bot)
    this.WebAPI = new WebAPI(this.Bot)
    this.setEventListeners() // Recreate event listeners

    // Try again
    this.status.db = await this.DBMonitor.start()
    this.status.stats = await this.LiveStatistics.start()
    this.status.api = await this.WebAPI.start()

    // tslint:disable-next-line:no-console
    console.log(`@@@@@ db: ${this.status.db}, stats: ${this.status.stats}, api: ${this.status.api}`)
    if (this.status.db && this.status.stats && this.status.api) {
      this.unhealthyRecovered = true
      const channel = <TextChannel>this.Bot.client.channels.find(c => c.id === this.announcementsChannel)
      await channel.send(`:hammer_pick: **Services Auto Restored:** I've successfully recovered myself :blush:`)
    } else {
      this.unhealthyRecovered = false
      // If unhealthy, alert an admin (Only if Discord was able to actually connect)
      if (this.status.discord && this.unhealthyRecovered) await this.helpMe()
    }

    this.unhealthyRecovering = false
    this.unhealthyRecoveryCount += 1
  }

  private async discordAPIReady() {
    // tslint:disable-next-line:no-console
    console.log('waiting for discord.js ready event')
    return new Promise<boolean>(async r => {
      /// Client ready ///
      // tslint:disable-next-line:no-console
      this.Bot.client.on('ready', () => {
        console.log('+++++ on ready')
        this.Bot.onReady()
        r(true)
      })
      /// Connect account ///
      // tslint:disable-next-line:no-console
      await this.Bot.client.login(process.env.DISCORD_APP_TOKEN)
    })
  }

  private async helpMe() {
    const maintainers = process.env.DISCORD_ANNOUNCEMENTS_MAINTAINERS_MENTION.split(',')
    var maintainersMention = ``

    // Build maintainers mentions
    maintainers.forEach(m => {
      maintainersMention += `<@${m}> `
    })

    const channel = <TextChannel>this.Bot.client.channels.find(c => c.id === this.announcementsChannel)
    await channel.send(`:warning: **Critical:** Bot Maintenance Required!

One of the bot maintainers: ${maintainersMention} will need to address this issue.

Depending on which services are struggling some to all bot functionality may be impacted:
\`\`\`
Help! I've fallen, and I can't get up..

API ............... ${this.status.api ? '✓ Started' : '✕ Down'}
Command Router .... Coming Soon
Database: ......... ${this.status.db ? '✓ Connected' : '✕ Disconnected'}
Discord ........... ✓ If it wasn't how would you be seeing this 😉
Stats ............. ${this.status.stats ? '✓ Started' : '✕ Down'}\`\`\``)
  }

  private async checkPingThreshold() {
    // Ignore sending threshold message if startup failed
    if (this.unhealthyStartup && !this.unhealthyRecovered) return

    const t = Number(process.env.DB_MONITOR_PING_FAILED_THRESHOLD || 10)
    if (this.DBMonitor.pingFailedCount >= t) {
      const channel = <TextChannel>this.Bot.client.channels.find(c => c.id === this.announcementsChannel)
      if (this.unhealthyRecoveryCount === 0) await channel.send(`:warning: **Database Alert:** The Database has failed ${t} pings.. Will attempt to auto correct shortly..`)

      await this.tryUnhealthyRecovery()
    }
  }
}
