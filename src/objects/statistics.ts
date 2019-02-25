import { ObjectID } from 'bson';

export type Statistic = 'discord-api-calls'
  | 'messages-seen'
  | 'messages-sent'
  | 'messages-tracked'
  | 'commands-routed'
  | 'commands-completed'
  | 'commands-invalid'
  | 'dms-received'
  | 'dms-sent'
  | 'users-online'
  | 'users-total'
  | 'users-registered'
  | 'servers-total'

export class BotStatistics {
  public _id: ObjectID
  public name: string = process.env.DISCORD_APP_NAME
  public uptime: number = 0
  public startTimestamp: number = Date.now()

  public messages = {
    seen: 0,
    sent: 0,
    tracked: 0
  }
  public commands = {
    routed: 0,
    completed: 0,
    invalid: 0,
    byCommand: {}
  }
  public dms = {
    received: 0,
    sent: 0
  }
  public users = {
    online: 0,
    total: 0,
    registered: 0
  }
  public servers = {
    total: 0
  }
  public discordAPICalls: number = 0


  public startup(init: BotStatistics) {
    // Strip certain values that would reset each bot restart
    delete init.uptime
    delete init.startTimestamp
    delete init.users
    // Now merge prps
    Object.assign(this, init)
  }
}

export class ServerStatistics {
  public sid: ObjectID
  public users = {
    total: 0,
    online: 0,
    registered: 0
  }
  public commands = {
    received: 0,
    sent: 0
  }
}