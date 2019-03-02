require('dotenv').config()
const packagejson = require('../package.json')
import * as Discord from 'discord.js';
import * as Task from './tasks/task';
import { MsgTracker, MongoDB, MongoDBLoader } from './db/database';
import { TrackedServer } from './objects/server';
import { Router } from './router/router';
import { Logging } from './utils/';
import { DISCORD_CLIENT_EVENTS } from './utils/client-event-handler';
import { BotMonitor } from './monitor';
import { buildBasePermissions } from './permissions/builder';
import { CommandPermissions } from './objects/permission';
import { routeLoader } from './router/route-loader';

export class Bot {
  public client = new Discord.Client();
  public DEBUG = new Logging.Debug('ldi:bot');
  public DEBUG_MIDDLEWARE = new Logging.Debug('ldi:midddleware');
  public DEBUG_MSG_INCOMING = new Logging.Debug('ldi:incoming');
  public DEBUG_MSG_SCHEDULED = new Logging.Debug('ldi:scheduled');
  public DEBUG_MSG_COMMAND = new Logging.Debug('ldi:command');
  public MsgTracker: MsgTracker
  public version: string

  // Service Monitors
  public BotMonitor: BotMonitor

  // Databases
  public DB: MongoDB
  // Background tasks
  public Task: Task.TaskManager = new Task.TaskManager()

  // Bot msg router
  public Router: Router = new Router(routeLoader(), this)

  public async start() {
    this.DEBUG.log('getting things setup...');
    this.version = packagejson.version
    this.MsgTracker = new MsgTracker(this);

    // Load DBs
    this.DB = await MongoDBLoader()

    // Start bot monitor & all bot dependant services
    this.BotMonitor = new BotMonitor(this)
    await this.BotMonitor.start()

    // Register background tasks
    this.Task.start(this, [
      new Task.ChastiKeyAPIRunningLocks(this),
      new Task.ChastiKeyAPIKeyholders(this),
      new Task.ChastiKeyAPILockees(this),
      new Task.ChastiKeyAPITotalLockedTime(this),
      new Task.PermissionsChannelAdditions(this)
    ])

    /// Event hndling for non-cached (messages from prior to restart) ///
    this.client.on('raw', async event => {
      if (event.t === null) return
      // Skip event types that are not mapped
      // this.DEBUG_MSG_INCOMING.log('raw:', event.t)
      // if (event.t === 'PRESENCE_UPDATE') console.log(event)
      if (!DISCORD_CLIENT_EVENTS.hasOwnProperty(event.t)) return;
      await this.onMessageNonCachedReact(event)
    });

    /// Incoming message router ///
    this.client.on('message', async (msg) => await this.onMessage(msg));
    ///Server connect/disconnect///
    this.client.on('guildCreate', async guild => this.onGuildCreate(guild))
    this.client.on('guildDelete', async guild => this.onGuildDelete(guild))
    this.client.on('guildUpdate', async guild => this.onGuildCreate(guild))
    ///   Reaction in (Cached)  ///
    // this.client.on('messageReactionAdd', (react, user) => this.onMessageCachedReactionAdd(react, user))
    ///  Reaction out (Cached)  ///
    // this.client.on('messageReactionRemove', (react, user) => this.onMessageCachedReactionRemove(react, user))
  }

  public async onReady() {
    this.DEBUG.log(`### Logged in as ${this.client.user.tag}!`);
    var guilds = this.client.guilds.array()

    // Only try processing these if the DB is active
    if (this.BotMonitor.status.db) {
      for (let index = 0; index < guilds.length; index++) {
        const guild = guilds[index];
        this.DEBUG.log(`===> connecting to server => ${guild.name}`)
        await this.DB.update('servers', { id: guild.id }, new TrackedServer(guild), { upsert: true })
        // console.log(buildBasePermissions(guild, this.Router.routes), { upsert: true })

        // Build base permissions
        const basePermissions = buildBasePermissions(guild, this.Router.routes)
        // Get base permissions count from the db
        const basePermissionsStored = await this.DB.getMultiple<CommandPermissions>('command-permissions', { serverID: guild.id })
        // Check count of base permissions
        const basePermissionsCount = basePermissions.length
        const basePermissionsStoredCount = basePermissionsStored.length

        // console.log('basePermissionsCount', basePermissionsCount)
        // console.log('basePermissionsStoredCount', basePermissionsStoredCount)

        if (basePermissionsCount > basePermissionsStoredCount) {
          await this.DB.addMany('command-permissions', buildBasePermissions(guild, this.Router.routes))
        }
        else {
          // Only add missing ones
          const baseDiff = basePermissions.filter(x => basePermissionsStored.findIndex(y => y.command === x.command) === -1)
          // console.log('diff', baseDiff)
          if (baseDiff.length > 0) await this.DB.addMany('command-permissions', baseDiff)
        }

      }
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
    this.DEBUG.log('Joined a new server: ' + guild.name);
    // Generate & store base permissions
    // const permissions = buildBasePermissions(guild, this.Router.routes)
    await this.DB.addMany('command-permissions',
      buildBasePermissions(guild, this.Router.routes))
    // Save some info about the server in db
    await this.DB.update('servers', { id: guild.id }, new TrackedServer(guild), { upsert: true })
  }

  private async onGuildDelete(guild: Discord.Guild) {
    await this.DB.remove('servers', { id: guild.id })
    this.DEBUG.log('Left a guild: ' + guild.name);
  }

  private async onMessageNonCachedReact(event: { t: Discord.WSEventType, d: any }) {
    const user = this.client.users.get(event.d.user_id)
    const channel = this.client.channels.get(event.d.channel_id) || await user.createDM()
    // Skip firing events for cached messages as these will already be properly handled
    // if ((<Discord.TextChannel>channel).messages.has(event.d.message_id)) return
    // Query channel for message as its not chached
    const message = await (<Discord.TextChannel>channel).fetchMessage(event.d.message_id)
    // Handling for custome/server emoji
    const emojiKey = event.d.emoji.id
      ? `${event.d.emoji.name}:${event.d.emoji.id}`
      : event.d.emoji.name;
    this.DEBUG_MSG_INCOMING.log('emojiKey', emojiKey)
    // Emit to handle in the regular handling used for cached messages
    // this.client.emit(DISCORD_CLIENT_EVENTS[event.t], reaction, user)
    if (event.t === 'MESSAGE_REACTION_ADD')
      return await this.onMessageCachedReactionAdd(message, emojiKey, user)
    if (event.t === 'MESSAGE_REACTION_REMOVE')
      return await this.onMessageCachedReactionRemove(message, emojiKey, user)
  }
}