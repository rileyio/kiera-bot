import { ObjectId } from 'bson'

export type BotStatistic = 'commands-routed' | 'commands-completed' | 'commands-invalid' | 'commands-seen'

export class BotStatistics {
  public _id: ObjectId
  public name: string = process.env.DISCORD_APP_NAME
  public uptime = 0
  public startTimestamp: number = Date.now()

  public version: string

  public messages = {
    seen: 0,
    sent: 0,
    tracked: 0
  }
  public commands = {
    byCommand: {},
    completed: 0,
    invalid: 0,
    routed: 0
  }
  public users = {
    registered: 0,
    total: 0
  }
  public servers = {
    total: 0
  }
  public discordAPICalls = 0

  // public get stats() {
  //   return {
  //     commands: this.commands,
  //     discordAPICalls: this.discordAPICalls,
  //     dms: this.dms,
  //     messages: this.messages,
  //     name: this.name,
  //     servers: this.servers,
  //     startTimestamp: this.startTimestamp,
  //     uptime: this.uptime,
  //     users: this.users,
  //     version: this.version
  //   }
  // }

  constructor(init: Partial<BotStatistics>) {
    this.version = init.version
  }

  public startup(init: BotStatistics) {
    // Strip certain values that would reset each bot restart
    delete init.uptime
    delete init.startTimestamp
    delete init.users
    // Now merge prps
    Object.assign(this, init)
  }
}

export enum ServerStatisticType {
  Message,
  MessageDeleted,
  MessageEdit,
  Reaction,
  ReactionRemoved,
  UserJoined,
  UserLeft,
  UserNicknameChanged,
  CommandSuccess,
  CommandFailure
}

/**
 * For User/Server statistics
 *
 * **Type of stats:**
 *   - Messages
 *   - Message Interactions (reactions, etc)
 *
 * **Types of possible reported stats:**
 *   - Time of day pop
 *   - User statistics
 *   - Trends
 *   - Server statistics
 *   - Channel statistics
 *   - Command usage
 * @export
 * @class ServerStatistic
 */
export class ServerStatistic {
  public readonly _id: ObjectId
  public serverID: string
  public userID: string
  public channelID: string
  public type: ServerStatisticType
  // Command Specific
  public command?: {
    name: string
    successful: boolean
  }

  constructor(init: Partial<ServerStatistic>) {
    Object.assign(this, init)
  }
}

export enum StatisticsSettingType {
  // Disables
  ServerDisableStats,
  ServerNonPublicStats,
  UserDisableStats,
  ChannelDisableStats,

  // Enables
  ServerEnableStats,
  UserEnableStats,
  ChannelEnableStats
}

export class StatisticsSetting {
  public readonly _id?: ObjectId
  public userID?: string
  public serverID?: string
  public channelID?: string
  public setting: StatisticsSettingType

  constructor(init: StatisticsSetting) {
    Object.assign(this, init)
  }
}
