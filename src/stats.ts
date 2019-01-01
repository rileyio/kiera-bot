import { Bot } from '.';
import { BotStatistics, ServerStatistics, Statistic } from './objects/statistics';

export class Statistics {
  private _Bot: Bot
  public Bot = new BotStatistics()
  public Server: Array<ServerStatistics> = []

  // Ticker states
  private uptimeTickerRunning = false
  private dbUpdateTickerRunning = false

  constructor(bot: Bot) {
    this._Bot = bot
  }


  public increment(stat: Statistic, valueOverride?: number) {
    switch (stat) {
      case 'discord-api-calls':
        this.Bot.discordAPICalls += 1
        break;
      case 'messages-seen':
        this.Bot.messages.seen += 1
        break;
      case 'messages-sent':
        this.Bot.messages.sent += 1
        break;
      case 'messages-tracked':
        this.Bot.messages.tracked += 1
        break;
      case 'commands-routed':
        this.Bot.commands.routed += 1
        break;
      case 'commands-completed':
        this.Bot.commands.completed += 1
        break;
      case 'commands-invalid':
        this.Bot.commands.invalid += 1
        break;
      case 'dms-received':
        this.Bot.dms.received += 1
        break;
      case 'dms-sent':
        this.Bot.dms.sent += 1
        break;
      case 'users-online':
        (valueOverride !== undefined)
          ? this.Bot.users.online = valueOverride
          : this.Bot.users.online += 1
        break;
      case 'users-total':
        (valueOverride !== undefined)
          ? this.Bot.users.total = valueOverride
          : this.Bot.users.total += 1
        break;
      case 'users-registered':
        (valueOverride !== undefined)
          ? this.Bot.users.registered = valueOverride
          : this.Bot.users.registered += 1
        break;
      case 'servers-total':
        (valueOverride !== undefined)
          ? this.Bot.servers.total = valueOverride
          : this.Bot.servers.total += 1
        break;

      default:
        break;
    }
  }

  public async loadExisting() {
    // Ensure db records exist
    if (!await this._Bot.BotStatistics.verify({ name: this.Bot.name })) {
      await this._Bot.BotStatistics.add(this.Bot)
    }

    // Get existing stats from DB
    const botStats = await this._Bot.BotStatistics.get({})
    // Init stats
    this.Bot.startup(botStats)

    // Start tickers
    this.uptimeTicker()
    this.dbUpdateTicker()
  }

  private uptimeTicker() {
    // Block from accidently being started twice
    if (!this.uptimeTickerRunning) {
      this.uptimeTickerRunning = true
      setInterval(() => {
        this.Bot.uptime = Date.now() - this.Bot.startTimestamp
      }, 1000)
    }
  }

  private dbUpdateTicker() {
    // Block from accidently being started twice
    if (!this.dbUpdateTickerRunning) {
      this.dbUpdateTickerRunning = true
      setInterval(async () => {
        await this._Bot.BotStatistics.update({
          name: this.Bot.name
        }, this.Bot)
      }, 10000)
    }
  }
}