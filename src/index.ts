const { version } = require('../package.json')
const { startup } = require('./startup')
import * as Discord from 'discord.js'
import * as Task from '@/tasks'
import * as Utils from '@/utils'
import Localization from '@/localization'
import { MsgTracker, MongoDB } from '@/db'
import { TrackedServer } from '@/objects/server'
import { CommandRouter, routeLoader } from '@/router'
import { BotMonitor } from '@/monitor'
import { Audit } from '@/objects/audit'
import { BattleNet } from '@/integrations/BNet'
import { Statistics } from '@/statistics'
import { ServerStatisticType } from './objects/statistics'
import { ChastiKey } from './integrations/ChastiKey'

export class Bot {
  public client: Discord.Client
  public Log = {
    API: new Utils.Logging.Debug('api'),
    Bot: new Utils.Logging.Debug('bot'),
    Command: new Utils.Logging.Debug('command'),
    Database: new Utils.Logging.Debug('database', { console: false }),
    Integration: new Utils.Logging.Debug('integration'),
    Router: new Utils.Logging.Debug('command-router'),
    Scheduled: new Utils.Logging.Debug('scheduled')
  }
  public MsgTracker: MsgTracker
  public version: string

  public channel: { auditLog: Discord.TextChannel; announcementsChannel: Discord.TextChannel } = {
    auditLog: null,
    announcementsChannel: null
  }

  // Audit Manager
  public Audit: Audit

  // Service Monitors
  public BotMonitor: BotMonitor

  // Databases
  public DB: MongoDB

  // Background tasks v0-4
  public Task: Task.TaskManager

  // Bot msg router
  public Router: CommandRouter

  // API Services
  public Service: { BattleNet: BattleNet; ChastiKey: ChastiKey } = {
    BattleNet: null,
    ChastiKey: null
  }

  // Statistics
  public Statistics: Statistics

  // Response Strings Renderer
  public Localization: Localization

  public async start() {
    this.version = version
    this.Log.Bot.log(`initializing kiera-bot (${this.version})...`)

    ////////////////////////////////////////
    // Register bot services ///////////////
    ////////////////////////////////////////
    this.Audit = new Audit(this)
    this.BotMonitor = new BotMonitor(this)
    this.Router = new CommandRouter(routeLoader(this.Log.Router), this)
    this.MsgTracker = new MsgTracker(this)
    this.Statistics = new Statistics(this)
    this.Task = new Task.TaskManager(this)

    ////////////////////////////////////////
    // Bot Monitor - Sync //////////////////
    ////////////////////////////////////////
    await this.BotMonitor.start()

    ////////////////////////////////////////
    // Background Tasks ////////////////////
    ////////////////////////////////////////
    // Register background tasks
    this.Task.start([
      new Task.ChastiKeyAPIUsers(),
      new Task.ChastiKeyAPIRunningLocks(),
      new Task.ChastiKeyAPILocktober(),
      // // new Task.ChastiKeyBackgroundLocktoberMonitor()
      new Task.ChastiKeyBackgroundVerifiedMonitor(),
      new Task.ChastiKeyGenerateStatsScheduled()
    ])

    ////////////////////////////////////////
    // Register 3rd party services /////////
    ////////////////////////////////////////
    this.Service.BattleNet = new BattleNet()
    this.Service.ChastiKey = new ChastiKey(this)

    ////////////////////////////////////////
    // Setup API Services //////////////////
    ////////////////////////////////////////
    try {
      /// Integrations / Services / 3rd party
      await this.Service.BattleNet.setup(this)
      await this.Service.ChastiKey.setup()
      /// Reserved...
      /// ...
    } catch (error) {
      console.log(`Error setting up a service!`, error)
    }

    ////////////////////////////////////////
    // Response Renderer ///////////////////
    ////////////////////////////////////////
    this.Localization = new Localization()

    ////////////////////////////////////////
    // Print startup details ///////////////
    ////////////////////////////////////////
    this.Log.Bot.log(
      this.Localization.$render(process.env.BOT_LOCALE, 'System.Startup', {
        routes: this.BotMonitor.WebAPI.configuredRoutes.length,
        commands: this.Router.routes.length,
        guilds: this.client.guilds.cache.size,
        users: await this.DB.count('users', {}),
        ping: this.BotMonitor.DBMonitor.pingTotalLatency / this.BotMonitor.DBMonitor.pingCount,
        langs: this.Localization.langs,
        strings: this.Localization.stringsCount,
        user: this.client.user.tag,
        version: this.version
      })
    )

    // ==========================================================================================
    // => Start allowing incoming command routing from here down
    // ==========================================================================================

    ////////////////////////////////////////
    // Discord Event Monitor / Routing /////
    ////////////////////////////////////////
    /// Event handling for non-cached (messages from prior to restart) ///
    this.client.on('raw' as any, async (event) => {
      if (event.t === null) return
      // Skip event types that are not mapped
      // this.DEBUG_MSG_INCOMING.log('raw:', event.t)
      // if (event.t === 'PRESENCE_UPDATE') console.log(event)
      if (!Utils.DISCORD_CLIENT_EVENTS.hasOwnProperty(event.t)) return
      await this.onMessageNonCachedReact(event)
    })

    /// Incoming message router ///
    this.client.on('message', async (msg) => await this.onMessage(msg))
    ///Server connect/disconnect///
    this.client.on('guildCreate', async (guild) => this.onGuildCreate(guild))
    this.client.on('guildDelete', async (guild) => this.onGuildDelete(guild))
    this.client.on('guildUpdate', async (guild) => this.onGuildCreate(guild))
    this.client.on('guildMemberAdd', (member) => this.onUserJoined(member))
    this.client.on('guildMemberRemove', (member) => this.onUserLeft(member))
    ///   Reaction in (Cached)  ///
    // this.client.on('messageReactionAdd', (react, user) => this.onMessageCachedReactionAdd(react, user))
    ///  Reaction out (Cached)  ///
    // this.client.on('messageReactionRemove', (react, user) => this.onMessageCachedReactionRemove(react, user))
  }

  public async onReady() {
    // Setup Bot utilized channels
    this.channel.auditLog = this.client.channels.cache.get(process.env.DISCORD_AUDITLOG_CHANNEL) as Discord.TextChannel
    this.channel.announcementsChannel = this.client.channels.cache.get(process.env.DISCORD_ANNOUNCEMENTS_CHANNEL) as Discord.TextChannel
  }

  private async onMessage(message: Discord.Message) {
    await this.Router.routeMessage(message)
  }

  private async onMessageCachedReactionAdd(message: Discord.Message, reaction: string, user: Discord.User) {
    this.Router.routeReaction(message, reaction, user, 'added')
  }

  private async onMessageCachedReactionRemove(message: Discord.Message, reaction: string, user: Discord.User) {
    this.Router.routeReaction(message, reaction, user, 'removed')
  }

  private async onGuildCreate(guild: Discord.Guild) {
    this.Log.Bot.log('Joined a new server: ' + guild.name)
    // Save some info about the server in db
    await this.DB.update('servers', { id: guild.id }, new TrackedServer(guild), { upsert: true })
  }

  private async onGuildDelete(guild: Discord.Guild) {
    await this.DB.remove('servers', { id: guild.id })
    this.Log.Bot.log('Left a guild: ' + guild.name)
  }

  private async onMessageNonCachedReact(event: { t: Discord.WSEventType; d: any }) {
    const user = this.client.users.cache.get(event.d.user_id)
    const channel = this.client.channels.cache.get(event.d.channel_id) as Discord.TextChannel
    // Skip firing events for cached messages as these will already be properly handled
    // if ((<Discord.TextChannel>channel).messages.has(event.d.message_id)) return
    // Query channel for message as its not chached
    const message = await channel.messages.fetch(event.d.message_id)
    // Handling for custome/server emoji
    const emojiKey = event.d.emoji.id ? `${event.d.emoji.name}:${event.d.emoji.id}` : event.d.emoji.name
    // Emit to handle in the regular handling used for cached messages
    // this.client.emit(DISCORD_CLIENT_EVENTS[event.t], reaction, user)
    if (event.t === 'MESSAGE_REACTION_ADD') return await this.onMessageCachedReactionAdd(message, emojiKey, user)
    if (event.t === 'MESSAGE_REACTION_REMOVE') return await this.onMessageCachedReactionRemove(message, emojiKey, user)
  }

  private onUserJoined(member: Discord.GuildMember | Discord.PartialGuildMember) {
    this.Statistics.trackServerStatistic(member.guild.id, null, member.user.id, ServerStatisticType.UserJoined)
  }

  private onUserLeft(member: Discord.GuildMember | Discord.PartialGuildMember) {
    this.Statistics.trackServerStatistic(member.guild.id, null, member.user.id, ServerStatisticType.UserLeft)
  }
}
