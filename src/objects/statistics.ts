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
  public readonly _id: ObjectID
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
  ServerDisableStats,
  ServerNonPublicStats,
  UserDisableStats,
  ChannelDisableStats
}

export class StatisticsSetting {
  public readonly _id?: ObjectID
  public userID?: string
  public serverID?: string
  public channelID?: string
  public setting: StatisticsSettingType

  constructor(init: StatisticsSetting) {
    Object.assign(this, init)
  }
}
