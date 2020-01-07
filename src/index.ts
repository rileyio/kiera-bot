const { version } = require('../package.json')
import * as Discord from 'discord.js'
import * as Task from '@/tasks'
import { MsgTracker, MongoDB, MongoDBLoader } from '@/db'
import { TrackedServer } from '@/objects/server'
import { Router, routeLoader } from '@/router'
import { Logging } from '@/utils'
import { BotMonitor } from '@/monitor'
import { Audit } from '@/objects/audit'
import { BattleNet } from '@/integrations/BNet'
import { Statistics } from '@/statistics'
import { ServerStatisticType } from './objects/statistics'
import { ChastiKey } from './integrations/ChastiKey'
import { DISCORD_CLIENT_EVENTS } from '@/utils'

export class Bot {
  public client = new Discord.Client()
  public DEBUG = new Logging.Debug('bot')
  public DEBUG_MIDDLEWARE = new Logging.Debug('midddleware')
  public DEBUG_MSG_INCOMING = new Logging.Debug('incoming')
  public DEBUG_MSG_SCHEDULED = new Logging.Debug('scheduled')
  public DEBUG_MSG_COMMAND = new Logging.Debug('command')
  public MsgTracker: MsgTracker
  public version: string
  public tokens: { bnet: string }
  public auditLogChannel: Discord.TextChannel

  // Audit Manager
  public Audit: Audit = new Audit(this)

  // Service Monitors
  public BotMonitor: BotMonitor

  // Databases
  public DB: MongoDB

  // Background tasks v0-4
  public Task: Task.TaskManager = new Task.TaskManager()

  // Bot msg router
  public Router: Router = new Router(routeLoader(), this)

  // API Services
  public Service = {
    BattleNet: new BattleNet(),
    ChastiKey: new ChastiKey()
  }

  // Statistics
  public Statistics: Statistics = new Statistics(this)

  public async start() {
    this.DEBUG.log('getting things setup...')
    this.version = version
    this.MsgTracker = new MsgTracker(this)

    ////////////////////////////////////////
    ///// Database Loader //////////////////
    ////////////////////////////////////////
    this.DB = await MongoDBLoader()

    ////////////////////////////////////////
    ///// Bot Monitor //////////////////////
    ////////////////////////////////////////
    // Start bot monitor & all bot dependant services
    this.BotMonitor = new BotMonitor(this)
    await this.BotMonitor.start()

    ////////////////////////////////////////
    ///// Background Tasks /////////////////
    ////////////////////////////////////////
    // Register background tasks
    this.Task.start(this, [
      new Task.ChastiKeyAPIUsers(),
      new Task.ChastiKeyAPIRunningLocks(),
      new Task.ChastiKeyAPILocktober(),
      // // new Task.ChastiKeyBackgroundLocktoberMonitor()
      new Task.ChastiKeyBackgroundVerifiedMonitor(),
      new Task.ChastiKeyGenerateStatsScheduled()
    ])

    ////////////////////////////////////////
    ///// Discord Event Monitor / Routing //
    ////////////////////////////////////////
    /// Event hndling for non-cached (messages from prior to restart) ///
    this.client.on('raw', async event => {
      if (event.t === null) return
      // Skip event types that are not mapped
      // this.DEBUG_MSG_INCOMING.log('raw:', event.t)
      // if (event.t === 'PRESENCE_UPDATE') console.log(event)
      if (!DISCORD_CLIENT_EVENTS.hasOwnProperty(event.t)) return
      await this.onMessageNonCachedReact(event)
    })

    /// Incoming message router ///
    this.client.on('message', async msg => await this.onMessage(msg))
    ///Server connect/disconnect///
    this.client.on('guildCreate', async guild => this.onGuildCreate(guild))
    this.client.on('guildDelete', async guild => this.onGuildDelete(guild))
    this.client.on('guildUpdate', async guild => this.onGuildCreate(guild))
    this.client.on('guildMemberAdd', member => this.onUserJoined(member))
    this.client.on('guildMemberRemove', member => this.onUserLeft(member))
    ///   Reaction in (Cached)  ///
    // this.client.on('messageReactionAdd', (react, user) => this.onMessageCachedReactionAdd(react, user))
    ///  Reaction out (Cached)  ///
    // this.client.on('messageReactionRemove', (react, user) => this.onMessageCachedReactionRemove(react, user))

    ////////////////////////////////////////
    ///// Setup API Services ///////////////
    ////////////////////////////////////////
    try {
      /// Integrations / Services / 3rd party
      await this.Service.BattleNet.setup(this)
      await this.Service.ChastiKey.setup(this)
      /// Reserved...
      /// ...
    } catch (error) {
      console.log(`Error setting up a service!`, error)
    }
  }

  public async onReady() {
    this.DEBUG.log(`### Logged in as ${this.client.user.tag}!`)
    var guilds = this.client.guilds.array()

    // Only try processing these if the DB is active
    if (this.BotMonitor.status.db) {
      for (let index = 0; index < guilds.length; index++) {
        const guild = guilds[index]
        // this.DEBUG.log(`===> connecting to server => ${guild.name}`)
        await this.DB.update('servers', { id: guild.id }, new TrackedServer(guild), { upsert: true })
      }

      // Setup Audit Log Channel
      this.auditLogChannel = this.client.channels.find(c => c.id === process.env.DISCORD_AUDITLOG_CHANNEL) as Discord.TextChannel
    }
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
    this.DEBUG.log('Joined a new server: ' + guild.name)
    // Save some info about the server in db
    await this.DB.update('servers', { id: guild.id }, new TrackedServer(guild), { upsert: true })
  }

  private async onGuildDelete(guild: Discord.Guild) {
    await this.DB.remove('servers', { id: guild.id })
    this.DEBUG.log('Left a guild: ' + guild.name)
  }

  private async onMessageNonCachedReact(event: { t: Discord.WSEventType; d: any }) {
    const user = this.client.users.get(event.d.user_id)
    const channel = this.client.channels.get(event.d.channel_id) || (await user.createDM())
    // Skip firing events for cached messages as these will already be properly handled
    // if ((<Discord.TextChannel>channel).messages.has(event.d.message_id)) return
    // Query channel for message as its not chached
    const message = await (<Discord.TextChannel>channel).fetchMessage(event.d.message_id)
    // Handling for custome/server emoji
    const emojiKey = event.d.emoji.id ? `${event.d.emoji.name}:${event.d.emoji.id}` : event.d.emoji.name
    this.DEBUG_MSG_INCOMING.log('emojiKey', emojiKey)
    // Emit to handle in the regular handling used for cached messages
    // this.client.emit(DISCORD_CLIENT_EVENTS[event.t], reaction, user)
    if (event.t === 'MESSAGE_REACTION_ADD') return await this.onMessageCachedReactionAdd(message, emojiKey, user)
    if (event.t === 'MESSAGE_REACTION_REMOVE') return await this.onMessageCachedReactionRemove(message, emojiKey, user)
  }

  private onUserJoined(member: Discord.GuildMember) {
    this.Statistics.trackServerStatistic(member.guild.id, null, member.user.id, ServerStatisticType.UserJoined)
  }

  private onUserLeft(member: Discord.GuildMember) {
    this.Statistics.trackServerStatistic(member.guild.id, null, member.user.id, ServerStatisticType.UserLeft)
  }
}
