require('dotenv').config()
const packagejson = require('../package.json')
import * as Debug from "debug";
import * as Discord from "discord.js";

import { incoming } from './incoming/msg';
import { MsgTracker } from "./db/database";
import { getChannel, deleteMessage, deleteAllMessages } from "./utils";
import { Lovense } from "./integration/lovense";

export class Bot {
  private client = new Discord.Client();
  private serverChannels: Discord.Collection<string, Discord.Channel>;
  public DEBUG = Debug('lovense-discord-bot:Bot');
  public DEBUG_MSG_INCOMING = Debug('lovense-discord-bot:incoming');
  public DEBUG_MSG_SCHEDULED = Debug('lovense-discord-bot:scheduled');
  public MsgTracker: MsgTracker
  public version: string

  // Connections/Integrations
  public Lovense: Lovense = new Lovense()

  constructor() {
    this.DEBUG('getting things setup...');
    this.version = packagejson.version
    this.MsgTracker = new MsgTracker(this);
    // On application startup & login
    this.client.on('ready', async () => {
      this.DEBUG(`Logged in as ${this.client.user.tag}!`);
      // Get channels
      this.serverChannels = this.client.channels
      // Cleanup channel - if set in .env
      if (process.env.BOT_MESSAGE_CLEANUP_CLEAR_CHANNEL === 'true') {
        await deleteAllMessages(getChannel(this.serverChannels, process.env.DISCORD_TEST_CHANNEL))
      }
    });

    ////// Incoming message router //////
    this.client.on('message', (msg) => incoming(this, msg));

    //////   Connect application  //////
    this.client.login(process.env.DISCORD_APP_TOKEN);

    //////    Internal Events     //////
    this.MsgTracker.on('msg-tracker--remove-msg', async (id, channelId) => {
      await deleteMessage(getChannel(this.serverChannels, channelId), id, this.DEBUG_MSG_SCHEDULED)
    })
  }
}

// Start bot (may be moved elsewhere later)
new Bot();