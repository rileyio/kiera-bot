import { ObjectID } from 'bson'

export type BotStatistic =
  | 'discord-api-calls'
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

export enum UserStatisticsType {
  Message,
  Reaction
}

export class UserStatistics {
  public _id: ObjectID
  public serverID: string
  public userID: string
  public channelID: string
  public type: UserStatisticsType

  constructor(init: Partial<UserStatistics>) {
    Object.assign(this, init)
  }
}

export class ServerStatistics {
  public _id: ObjectID
  public serverID: string
  public serverName: string
  public date: string

  public usersJoined: number = 0
  public usersLeft: number = 0

  constructor(init: Partial<ServerStatistics>) {
    if (init) {
      Object.assign(this, init)
    } else {
      // Current Date
      const cd = new Date()
      cd.setHours(0, 0, 0, 0)

      this.date = cd.toISOString()
    }
  }
}
