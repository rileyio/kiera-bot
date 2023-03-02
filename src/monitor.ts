import * as Discord from 'discord.js'

import { Bot } from '@/index'
import { DatabaseMonitor } from './db/monitor'
import { EventEmitter } from 'events'
import { LiveStatistics } from './live-statistics'
import { WebAPI } from './api/web-api'
import { read as getSecret } from '@/secrets'

export class BotMonitor extends EventEmitter {
  private Bot: Bot
  public DBMonitor: DatabaseMonitor
  public WebAPI: WebAPI
  public LiveStatistics: LiveStatistics
  public status = {
    api: false,
    db: false,
    discord: false,
    stats: false
  }

  // States
  public unhealthyStartup: boolean
  public unhealthyRecovered = false
  public unhealthyRecovering: boolean
  public unhealthyRecoveryCount = 0

  constructor(bot: Bot) {
    super()
    this.Bot = bot
    this.DBMonitor = new DatabaseMonitor(this.Bot)
    this.LiveStatistics = new LiveStatistics(this.Bot)
    this.WebAPI = new WebAPI(this.Bot)

    this.setEventListeners()
  }

  public async start() {
    this.Bot.Log.Bot.log('starting BotMonitor...')

    // Load Plugins
    await this.Bot.Plugin.setup()

    // Start main components
    this.status.db = await this.DBMonitor.start()
    this.status.discord = await this.discordAPIReady()
    this.status.stats = await this.LiveStatistics.start()
    this.status.api = await this.WebAPI.start()

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
      this.Bot.Log.Bot.warn('⚠️ Killing service in 3 seconds')

      setTimeout(() => {
        process.exit(99)
      }, 3000)

      return
    }

    if (this.unhealthyRecovering) return // block dups
    this.unhealthyRecovering = true

    this.Bot.Log.Bot.warn('------ trying an unhealty recovery of services - since most rely on the db')
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

    if (this.status.db && this.status.stats && this.status.api) {
      this.unhealthyRecovered = true
      if (this.Bot.channel.announcementsChannel)
        await this.Bot.channel.announcementsChannel.send(`:hammer_pick: **Services Auto Restored:** I've successfully recovered myself :blush:`)
    } else {
      this.unhealthyRecovered = false
      // If unhealthy, alert an admin (Only if Discord was able to actually connect)
      if (this.status.discord && this.unhealthyRecovered) await this.helpMe()
    }

    this.unhealthyRecovering = false
    this.unhealthyRecoveryCount += 1
  }

  private async discordAPIReady() {
    this.Bot.Log.Bot.log('creating discord client...')

    // Set intents
    const intents = [
      Discord.GatewayIntentBits.Guilds,
      Discord.GatewayIntentBits.GuildMembers,
      Discord.GatewayIntentBits.GuildBans,
      Discord.GatewayIntentBits.GuildEmojisAndStickers,
      Discord.GatewayIntentBits.GuildMessages,
      Discord.GatewayIntentBits.GuildMessageReactions,
      Discord.GatewayIntentBits.GuildMessageTyping,
      Discord.GatewayIntentBits.DirectMessages,
      Discord.GatewayIntentBits.DirectMessageReactions,
      Discord.GatewayIntentBits.DirectMessageTyping
    ]

    this.Bot.Log.Bot.debug('intents set from preset:', intents)

    // Create new Discord Client
    this.Bot.client = new Discord.Client({ intents })
    // this.Bot.client = new Discord.Client()

    // Waiting for Discord.js Ready Event to fire...
    this.Bot.Log.Bot.debug('waiting for discord.js ready event...')
    return new Promise<boolean>(async (r) => {
      // * Client ready * //
      this.Bot.client.once(Discord.Events.ClientReady, () => {
        this.Bot.Log.Bot.debug('discord.js ready!')
        this.Bot.onReady()
        r(true)
      })

      // ! Client error ! //
      this.Bot.client.on(Discord.Events.Error, (error) => {
        this.Bot.Log.Bot.warn('discord.js NOT ready!', error)
      })

      // ? Connect account ? //
      await this.Bot.client.login(getSecret('DISCORD_APP_TOKEN', this.Bot.Log.Bot))
    })
  }

  private async helpMe() {
    try {
      const maintainers = process.env.DISCORD_ANNOUNCEMENTS_MAINTAINERS_MENTION.split(',')
      let maintainersMention = ``

      // Build maintainers mentions
      maintainers.forEach((m) => {
        maintainersMention += `<@${m}> `
      })

      if (this.Bot.channel.announcementsChannel)
        await this.Bot.channel.announcementsChannel.send(`:warning: **Critical:** Bot Maintenance Required!

One of the bot maintainers: ${maintainersMention} will need to address this issue.

Depending on which services are struggling some to all bot functionality may be impacted:
\`\`\`
Help! I've fallen, and I can't get up..

API ............... ${this.status.api ? '✓ Started' : '✕ Down'}
Database: ......... ${this.status.db ? '✓ Connected' : '✕ Disconnected'}
Discord ........... ✓ If it wasn't how would you be seeing this 😉
Stats ............. ${this.status.stats ? '✓ Started' : '✕ Down'}\`\`\``)
    } catch (error) {
      this.Bot.Log.Bot.error('Unable to broadcast impacting status via discord')
    }
  }

  private async checkPingThreshold() {
    // Ignore sending threshold message if startup failed
    if (this.unhealthyStartup && !this.unhealthyRecovered) return

    const t = Number(process.env.DB_MONITOR_PING_FAILED_THRESHOLD || 10)
    if (this.DBMonitor.pingFailedCount >= t) {
      if (this.unhealthyRecoveryCount === 0)
        if (this.Bot.channel.announcementsChannel)
          await this.Bot.channel.announcementsChannel.send(`:warning: **Database Alert:** The Database has failed ${t} pings.. Will attempt to auto correct shortly..`)

      await this.tryUnhealthyRecovery()
    }
  }
}
