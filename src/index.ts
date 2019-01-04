require('dotenv').config()
const packagejson = require('../package.json')
import * as Discord from 'discord.js';
import * as Utils from './utils';
import { MsgTracker, MongoDB, MongoDBLoader } from './db/database';
import { Lovense } from './integration/lovense';
import { TrackedUser } from './objects/user';
import { TrackedServer } from './objects/server';
import { TrackedMessage } from './objects/message';
import { Router } from './utils/router';
import { Routes } from './routes';
import { Session, DeviceSession } from './objects/sessions';
import { WebAPI } from './api/web-api';
import { BotStatistics } from './objects/statistics';
import { Statistics } from './stats';
import { Debug } from './logger';
import { AuthKey } from './objects/authkey';
import { DISCORD_CLIENT_EVENTS } from './utils/client-event-handler';

export class Bot {
  private WebAPI: WebAPI
  public client = new Discord.Client();
  public DEBUG = new Debug('ldi:bot');
  public DEBUG_MIDDLEWARE = new Debug('ldi:midddleware');
  public DEBUG_MSG_INCOMING = new Debug('ldi:incoming');
  public DEBUG_MSG_SCHEDULED = new Debug('ldi:scheduled');
  public DEBUG_MSG_COMMAND = new Debug('ldi:command');
  public MsgTracker: MsgTracker
  public version: string

  // Databases
  public AuthKeys: MongoDB<AuthKey>
  public BotStatistics: MongoDB<BotStatistics>
  public Messages: MongoDB<TrackedMessage>
  public Servers: MongoDB<TrackedServer>
  public ServerStatistics: MongoDB<BotStatistics>
  public Sessions: MongoDB<Session | DeviceSession>
  public Users: MongoDB<TrackedUser>

  // Stats tracking
  public Stats: Statistics

  // Connections/Integrations
  public Lovense: Lovense = new Lovense()

  // Bot msg router
  public Router: Router = new Router(Routes(), this)

  public async start() {
    this.DEBUG.log('getting things setup...');
    this.version = packagejson.version
    this.MsgTracker = new MsgTracker(this);

    // Load DBs
    this.AuthKeys = await MongoDBLoader('authkeys')
    this.BotStatistics = await MongoDBLoader('stats-bot')
    this.Messages = await MongoDBLoader('messages')
    this.Servers = await MongoDBLoader('server')
    this.ServerStatistics = await MongoDBLoader('stats-servers')
    this.Sessions = await MongoDBLoader('sessions')
    this.Users = await MongoDBLoader('users')

    // Initialize Stats
    this.Stats = new Statistics(this)
    await this.Stats.loadExisting()


    //////      Event hndling for non-cached (prior to restart)      //////
    this.client.on('raw', async event => {
      if (event.t === null) return
      // Skip event types that are not mapped
      console.log('raw:', event.t)
      // if (event.t === 'PRESENCE_UPDATE') console.log(event)
      if (!DISCORD_CLIENT_EVENTS.hasOwnProperty(event.t)) return;
      this.onMessageNonCachedReact(event)
    });

    //////      Client ready       //////
    this.client.on('ready', () => this.onReady())
    ////// Incoming message router //////
    this.client.on('message', (msg) => this.onMessage(msg));
    //////Server connect/disconnect//////
    this.client.on('guildCreate', async guild => this.onGuildCreate(guild))
    this.client.on('guildDelete', async guild => this.onGuildDelete(guild))
    //////   Reaction in (Cached)  //////
    // this.client.on('messageReactionAdd', (react, user) => this.onMessageCachedReactionAdd(react, user))
    // //////  Reaction out (Cached)  //////
    // this.client.on('messageReactionRemove', (react, user) => this.onMessageCachedReactionRemove(react, user))
    //////     Connect account     //////
    this.client.login(process.env.DISCORD_APP_TOKEN);
  }

  private async onReady() {
    this.DEBUG.log(`Logged in as ${this.client.user.tag}!`);
    // Get channels
    // Cleanup channel - if set in .env
    if (process.env.BOT_MESSAGE_CLEANUP_CLEAR_CHANNEL === 'true') {
      await Utils.Channel.cleanTextChat(
        Utils.Channel.getTextChannel(this.client.channels, process.env.DISCORD_TEST_CHANNEL),
        this.DEBUG_MSG_SCHEDULED
      )
    }

    var guilds = this.client.guilds.array()

    for (let index = 0; index < guilds.length; index++) {
      const guild = guilds[index];
      this.DEBUG.log(`connecting to server => ${guild.name}`)
      this.Servers.update({ id: guild.id }, new TrackedServer(guild), { upsert: true })
    }
  }

  private async onMessage(message: Discord.Message) {
    await this.Router.routeMessage(message)
  }

  private async onMessageCachedReactionAdd(message: Discord.Message, reaction: Discord.MessageReaction, user: Discord.User) {
    this.Router.routeReaction(message, reaction, user, 'added')
  }

  private async onMessageCachedReactionRemove(message: Discord.Message, reaction: Discord.MessageReaction, user: Discord.User) {
    this.Router.routeReaction(message, reaction, user, 'removed')
  }

  private async onGuildCreate(guild: Discord.Guild) {
    this.DEBUG.log('Joined a new server: ' + guild.name);
    // Save some info about the server in db
    await this.Servers.update({ id: guild.id }, new TrackedServer(guild), { upsert: true })
  }

  private async onGuildDelete(guild: Discord.Guild) {
    await this.Servers.remove({ id: guild.id })
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
    console.log('emojiKey', emojiKey)
    // Emit to handle in the regular handling used for cached messages
    // this.client.emit(DISCORD_CLIENT_EVENTS[event.t], reaction, user)
    if (event.t === 'MESSAGE_REACTION_ADD')
      return await this.onMessageCachedReactionAdd(message, event.d, user)
    if (event.t === 'MESSAGE_REACTION_REMOVE')
      return await this.onMessageCachedReactionRemove(message, event.d, user)
  }

  public startWebAPI() {
    // Start WebAPI
    this.WebAPI = new WebAPI(this)
    this.WebAPI.listen()
  }

}