import * as Discord from 'discord.js'
import * as Task from '@/tasks'
import * as Utils from '@/utils'

import { CommandRouter, routeLoader } from '@/router'
import { MongoDB, MsgTracker } from '@/db'

import { Audit } from '@/objects/audit'
import { BattleNet } from '@/integrations/BNet'
import { BotMonitor } from '@/monitor'
import { ChastiKey } from './integrations/ChastiKey'
import Localization from '@/localization'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { ServerStatisticType } from './objects/statistics'
import { Statistics } from '@/statistics'
import { version } from '@/../package.json'

const DEFAULT_LOCALE = process.env.BOT_LOCALE

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
    announcementsChannel: null,
    auditLog: null
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
    this.Router = new CommandRouter(await routeLoader(this.Log.Router), this)
    this.MsgTracker = new MsgTracker(this)
    this.Task = new Task.TaskManager(this)

    ////////////////////////////////////////
    // Bot Monitor - Sync //////////////////
    ////////////////////////////////////////
    await this.BotMonitor.start()

    ////////////////////////////////////////
    // Start Stats /////////////////////////
    ////////////////////////////////////////
    this.Statistics = new Statistics(this)

    ////////////////////////////////////////
    // Background Tasks ////////////////////
    ////////////////////////////////////////
    // Register background tasks
    this.Task.start([
      new Task.StatusMessageRotatorScheduled(),
      new Task.ChastiKeyAPIUsers(),
      new Task.ChastiKeyAPIRunningLocks(),
      new Task.ChastiKeyAPILocktober2019(),
      new Task.ChastiKeyAPILocktober2020(),
      new Task.ChastiKeyAPILocktober2021(),
      // // new Task.ChastiKeyBackgroundLocktoberMonitor()
      new Task.ChastiKeyBackgroundVerifiedMonitor(),
      new Task.ChastiKeyGenerateStatsScheduled(),
      new Task.DBAgeCleanupScheduled()
      // new Task.StatsCleanerScheduled()
    ])

    ////////////////////////////////////////
    // Register 3rd party services /////////
    ////////////////////////////////////////
    // this.Service.BattleNet = new BattleNet()
    this.Service.ChastiKey = new ChastiKey(this)

    ////////////////////////////////////////
    // Setup API Services //////////////////
    ////////////////////////////////////////
    try {
      /// Integrations / Services / 3rd party
      // await this.Service.BattleNet.setup(this)
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
      this.Localization.$render(DEFAULT_LOCALE, 'System.Startup', {
        commands: this.Router.routes.length,
        guilds: this.client.guilds.cache.size,
        langs: this.Localization.langs,
        ping: this.BotMonitor.DBMonitor.pingTotalLatency / this.BotMonitor.DBMonitor.pingCount,
        routes: this.BotMonitor.WebAPI.configuredRoutes.length,
        strings: this.Localization.stringsCount,
        user: this.client.user.tag,
        users: await this.DB.count('users', {}),
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
    /// Incoming message router (v8.0-beta-3 and newer commands) ///
    this.client.on('interactionCreate', async (int) => await this.onInteraction(int))
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

    /// Update guilds info stored ///
    for (const guild of [...this.client.guilds.cache.values()]) {
      // Check if Guild info is cached
      // console.log('Guild Connection/Update in Servers Collection', guild.id, guild.name)
      await this.DB.update(
        'servers',
        { id: guild.id },
        {
          $set: {
            id: guild.id,
            joinedTimestamp: guild.joinedTimestamp,
            lastSeen: Date.now(),
            name: guild.name,
            ownerID: guild.ownerId
          }
        },
        { atomic: true, upsert: true }
      )
    }
  }

  public async onReady() {
    // Setup Bot utilized channels
    this.channel.auditLog = this.client.channels.cache.get(process.env.DISCORD_AUDITLOG_CHANNEL) as Discord.TextChannel
    this.channel.announcementsChannel = this.client.channels.cache.get(process.env.DISCORD_ANNOUNCEMENTS_CHANNEL) as Discord.TextChannel

    // Register Slash commands on Kiera's Development server
    const commands = []
    for (const commandRoute of this.Router.routes) commandRoute.slash ? commands.push(commandRoute.slash.toJSON()) : null

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_APP_TOKEN)

    try {
      console.log('Started refreshing application (/) commands.')
      // ! Disabling ESLINT for the following line of code till shit gets fixed in the source libs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.DISCORD_BOT_OFFICAL_DISCORD) as any, { body: commands })
      console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
      console.error(error)
    }
  }

  private async onMessage(message: Discord.Message) {
    await this.Router.routeMessage(message)
  }

  private async onInteraction(interaction: Discord.Interaction) {
    await this.Router.routeInteraction(interaction)
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
    await this.DB.update(
      'servers',
      { id: guild.id },
      {
        $set: {
          id: guild.id,
          joinedTimestamp: guild.joinedTimestamp,
          lastSeen: Date.now(),
          name: guild.name,
          ownerID: guild.ownerId,
          prefix: undefined,
          slashCommandsEnabled: false
        }
      },
      { atomic: true, upsert: true }
    )
  }

  private async onGuildDelete(guild: Discord.Guild) {
    await this.DB.remove('servers', { id: guild.id })
    this.Log.Bot.log('Left a guild: ' + guild.name)
  }

  private async onMessageNonCachedReact(event: { t: Discord.WSEventType; d: any }) {
    const user = await this.client.users.fetch(event.d.user_id)
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
