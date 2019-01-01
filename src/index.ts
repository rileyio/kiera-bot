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
    
    // On application startup & login
    this.client.on('ready', async () => {
      this.DEBUG.log(`Logged in as ${this.client.user.tag}!`);
      // Get channels
      // Cleanup channel - if set in .env
      if (process.env.BOT_MESSAGE_CLEANUP_CLEAR_CHANNEL === 'true') {
        await Utils.Channel.cleanTextChat(
          Utils.Channel.getTextChannel(this.client.channels, process.env.DISCORD_TEST_CHANNEL),
          this.DEBUG_MSG_SCHEDULED
        )
      }

      /////// TESTING ///////
      var guilds = this.client.guilds.array()

      for (let index = 0; index < guilds.length; index++) {
        const guild = guilds[index];
        this.DEBUG.log(`connecting to server => ${guild.name}`)
        this.Servers.update({ id: guild.id }, new TrackedServer(guild), { upsert: true })
      }

    });

    ////// Incoming message router //////
    this.client.on('message', (msg) => this.Router.route(msg));

    //////     Connect account     //////
    this.client.login(process.env.DISCORD_APP_TOKEN);

    //////Server connect/disconnect//////
    //joined a server
    this.client.on('guildCreate', async guild => {
      this.DEBUG.log('Joined a new server: ' + guild.name);
      // Save some info about the server in db
      this.Servers.update({ id: guild.id }, new TrackedServer(guild), { upsert: true })
    })

    //removed from a server
    this.client.on('guildDelete', async guild => {
      await this.Servers.remove({ id: guild.id })
      this.DEBUG.log('Left a guild: ' + guild.name);
    })

    //////    Internal Events     //////
  }

  public startWebAPI() {
    // Start WebAPI
    this.WebAPI = new WebAPI(this)
    this.WebAPI.listen()
  }

}