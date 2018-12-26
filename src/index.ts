require('dotenv').config()
const packagejson = require('../package.json')
import * as Debug from "debug";
import * as Discord from "discord.js";

// import { incoming } from './incoming/msg';
import { MsgTracker, DB, Databases, DBLoader } from "./db/database";
import { getChannel, deleteMessage, deleteAllMessages } from "./utils";
import { Lovense } from "./integration/lovense";
import { TrackedUser } from "./objects/user";
import { TrackedServer } from "./objects/server";
import { TrackedMessage } from "./objects/message";
import { Router } from "./utils/router";
import { Routes } from "./routes";

export class Bot {
  private serverChannels: Discord.Collection<string, Discord.Channel>;
  public client = new Discord.Client();
  public DEBUG = Debug('ldi:Bot');
  public DEBUG_MIDDLEWARE = Debug('ldi:midddleware');
  public DEBUG_MSG_INCOMING = Debug('ldi:incoming');
  public DEBUG_MSG_SCHEDULED = Debug('ldi:scheduled');
  public DEBUG_MSG_COMMAND = Debug('ldi:command');
  public MsgTracker: MsgTracker
  public version: string

  // Databases
  public Messages: DB<TrackedMessage>
  public Servers: DB<TrackedServer>
  public Users: DB<TrackedUser>

  // Connections/Integrations
  public Lovense: Lovense = new Lovense()

  // Bot msg router
  public Router: Router = new Router(Routes(), this)

  public async start() {
    this.DEBUG('getting things setup...');
    this.version = packagejson.version
    this.MsgTracker = new MsgTracker(this);

    // Load DBs
    // this.Messages = await DBLoader(Databases.MESSAGES)
    this.Servers = await DBLoader(Databases.SERVERS)
    this.Users = await DBLoader(Databases.USERS)

    // On application startup & login
    this.client.on('ready', async () => {
      this.DEBUG(`Logged in as ${this.client.user.tag}!`);
      // Get channels
      this.serverChannels = this.client.channels
      // Cleanup channel - if set in .env
      if (process.env.BOT_MESSAGE_CLEANUP_CLEAR_CHANNEL === 'true') {
        await deleteAllMessages(getChannel(this.serverChannels, process.env.DISCORD_TEST_CHANNEL))
      }

      /////// TESTING ///////
      var guilds = this.client.guilds.array()

      for (let index = 0; index < guilds.length; index++) {
        const guild = guilds[index];
        this.DEBUG(`connecting to server => ${guild.name}`)
        this.Servers.update({ id: guild.id }, new TrackedServer(guild), true)
      }

    });

    ////// Incoming message router //////
    this.client.on('message', (msg) => this.Router.route(msg));

    //////     Connect account     //////
    this.client.login(process.env.DISCORD_APP_TOKEN);

    //////Server connect/disconnect//////
    //joined a server
    this.client.on("guildCreate", async guild => {
      this.DEBUG("Joined a new server: " + guild.name);
      // Save some info about the server in db
      this.Servers.update({ id: guild.id }, new TrackedServer(guild), true)
    })

    //removed from a server
    this.client.on("guildDelete", async guild => {
      await this.Servers.remove({ id: guild.id })
      this.DEBUG("Left a guild: " + guild.name);
    })

    //////    Internal Events     //////
    this.MsgTracker.on('msg-tracker--remove-msg', async (id, channelId) => {
      await deleteMessage(getChannel(this.serverChannels, channelId), id, this.DEBUG_MSG_SCHEDULED)
    })
  }

}

// Start bot (may be moved elsewhere later)
const bot = new Bot();
bot.start()