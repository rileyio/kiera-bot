import { ObjectID } from 'bson';
import { GuildChannel } from 'discord.js';

export interface TextChannelExtended extends GuildChannel {
  permissions: Array<CommandPermissionsAllowed>
}

export class CommandPermissions {
  public readonly _id: ObjectID
  /**
   * DB Reference record
   * @type {ObjectID}
   * @memberof CommandPermissions
   */
  public sid: ObjectID
  /**
   * Discord server ID - quicker lookup to avoid multiple queries 
   * at command validate runtime
   * @type {string}
   * @memberof CommandPermissions
   */
  public serverID: string
  public command: string
  /**
   * Defaults to true for: on
   * @type {boolean}
   * @memberof CommandPermissions
   */
  public enabled: boolean = true
  public allowed: Array<CommandPermissionsAllowed> = []
  /**
   * Example command (Note: Really should only should be mapped for display purposes)
   * @type {string}
   * @memberof CommandPermissions
   */
  public example?: string

  constructor(init: Partial<CommandPermissions>) {
    Object.assign(this, init)
  }
}

export class CommandPermissionsAllowed {
  /**
   * Type of target to apply rule for
   * @type {('channel' | 'user')}
   * @memberof CommandPermissionsAllowed
   */
  public type: 'channel' | 'role' | 'user'
  /**
   * Target should contain the <DISCORD> channel ID, or User ID, etc
   * TODO: add support for ObjectID since they are alphanum vs discord's being number only
   * @type {string}
   * @memberof CommandPermissionsAllowed
   */
  public target: string
  /**
   * Flat: Is it allowed
   * 
   * Defaults to allow
   * 
   * @type {boolean}
   * @memberof CommandPermissionsAllowed
   */
  public allow?: boolean = true
  public name: string
  /**
   * Nested, but should only be 1 layer deep
   * TODO: Look into possible nesting
   * @type {Array<CommandPermissionsAllowed>}
   * @memberof CommandPermissionsAllowed
   */
  public exceptions?: Array<CommandPermissionsAllowed> = []

  constructor(init: Partial<CommandPermissionsAllowed>) {
    Object.assign(this, init)
  }
}