import * as Discord from 'discord.js'
import { Message, Channel, TextChannel } from "discord.js";
import { TrackedUserQuery } from './db/users';
import * as XRegex from 'xregexp';
import { TrackedUser } from './objects/user';

export interface TypeValidation {
  name: string
  type: string
  required?: boolean
  value?: boolean | number | string
  valid?: boolean
}

export enum UserRefType {
  /**
   * discord uses as the user id
   * 
   * Typically seen when only using an id or 
   * Example: `<@146439529824256000>`
   */
  snowflake,
  /**
   * just username (not very useful on its own)
   */
  usernameOnly,
  /**
   * username like: `@user#0000`
   */
  usernameFull
}

export enum UserAtType {
  /**
   */
  wrappedSnowflake,
  /**
   * Example: @user#0000
   */
  usernameFull
}

/**
 * Deletes a message from a textChannel
 * @export
 * @param {*} textChannel
 * @param {string} messageId
 */
export async function deleteMessage(textChannel: any, messageId: string, debug: debug.IDebugger) {
  // Find message in channel
  const msg: Discord.Message = await textChannel.fetchMessage(messageId)
  // Race Condition check: Double check something was found (that it wasn't deleted by a user too quick)
  // Delete message
  await msg.delete()
  debug(`deleted message id:${messageId} channelId:${textChannel.id}`)
}

export async function deleteAllMessages(textChannel: any) {
  const messages = await textChannel.fetchMessages()
  await messages.deleteAll()
}

/**
 * Get channel from a collection
 * @export
 * @template T
 * @param {Discord.Collection<string, Discord.Channel>} channelCollection
 * @param {string} channelId
 * @returns
 */
export function getChannel(channelCollection: Discord.Collection<string, Discord.Channel>, channelId: string) {
  const channel = channelCollection.array().find(ch => ch.id === channelId)
  return channel
}

/**
 * Splits args at spaces
 * 
 * Additional: will remove excess whitespaces to prevent messing up the \s split
 * 
 * @export
 * @param {string} msg
 * @returns
 */
export function getArgs(msg: string) {
  return msg.replace(/^\!/, '').replace(/\s+/g, ' ').split(' ')
}

/**
 * Validates the chat arguments against the TypeValidations provided to determine
 * if all arguments meet the defined type
 * @export
 * @param {Array<string>} args
 * @param {Array<TypeValidation>} validation
 * @returns
 */
export function validateArgs(args: Array<string>, validation: Array<TypeValidation>) {
  var allValid = true
  var ret: any = {}
  var validated = validation.map((v: TypeValidation, i: number) => {
    // Check if type matches
    v.valid = validateType(v.type, args[i])
    v.value = (v.type === 'user') ? extractUserIdFromString(args[i]) : args[i]
    // Fix: If expected type is valid and is a number, convert it to a number
    v.value = (v.type === 'number' && v.valid) ? Number(v.value) : args[i]
    // Update allValid
    if (!v.valid && v.required) {
      // If the value fails a check (or is empty) but IS required
      allValid = false
    }
    // Add v to ret
    ret[v.name] = v.value
    return v
  })

  return { valid: allValid, validated: validated, o: ret }
}

/**
 * Basic type validator - Validates:
 * - `user` (this can be both a snowflake or @user#0000)
 * - `string`
 * - `number`
 * - `boolean`
 * @export
 * @param {string} expected
 * @param {(boolean | number | string)} value
 * @returns
 */
export function validateType(expected: string, value: boolean | number | string) {
  if (expected === 'user')
    // From a server channel it should look like: <@146439529824256000>
    // Check that first
    return /^\<\@([0-9]*)\>$/i.test(value.toString()) || /^(\@((?!@|#|:|`).*)\#[0-9]{4,5})$/i.test(value.toString())
  if (expected === 'string')
    return typeof value === 'string'
  if (expected === 'number') {
    return Number.isNaN(Number(value)) === false
  }
  if (expected === 'boolean')
    return value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false'
  return false
}

/**
 * Extract id from a snowflake if still wrapped like: <@146439529824256000>
 * Has built in fallback so can be used on normal @user#0000 values as well
 * @export
 * @param {string} data
 * @returns
 */
export function extractUserIdFromString(data: string) {
  // If the user id is wrapped like: <@146439529824256000> remove it from the @ and brackets
  if (/^\<\@([0-9]*)\>$/i.test(data)) {
    const regexResult = /^\<\@([0-9]*)\>$/i.exec(data)

    const containsResults = regexResult.length > 0
    if (containsResults) return regexResult[1]
  }
  // Fallback
  return data
}

/**
 * Used to determine the type of user data passed, between snowflake or regular @ string
 * @export
 * @param {string} data
 * @returns {UserRefType}
 */
export function verifyUserRefType(data: string): UserRefType {
  if (/^\<\@([0-9]*)\>$/i.test(data)) return UserRefType.snowflake
  if (/^(\@((?!@|#|:|`).*)\#[0-9]{4,5})$/i.test(data)) return UserRefType.usernameFull
  if (typeof data === 'string' && !Number.isNaN(Number(data))) return UserRefType.snowflake
}

/**
 * Build a db query for user lookup based on input factors and the type of data given
 * @export
 * @param {string} input
 * @param {UserRefType} type
 * @returns {TrackedUserQuery}
 */
export function buildUserQuery(input: string, type: UserRefType): TrackedUserQuery {
  if (type === UserRefType.snowflake) return { id: extractUserIdFromString(input) }
  if (type === UserRefType.usernameFull) {
    const regex = XRegex('^(\\@(?<username>(?!@|#|:|`).*)\\#(?<discriminator>[0-9]{4,5}))$', 'i')
    const match = XRegex.exec(input, regex)
    return { username: match.username, discriminator: match.discriminator }
  }
}

/**
 * Builds a DM specific @user#0000 because DMs don't use snowflakes
 * @export
 * @param {TrackedUser} user
 * @returns string
 */
export function buildUserFull(user: TrackedUser): string {
  return `@${user.username}#${user.discriminator}`
}

/**
 * Builds an in-chat snowflake reference to properly trigger the @user
 * @export
 * @param {(string | TrackedUser)} user
 * @returns string
 */
export function buildUserWrappedSnowflake(user: string | TrackedUser): string {
  if (typeof user === 'string') return `<@${user}>`
  if (typeof user === 'object') return `<@${user.id}>`
}

/**
 * Takes the source input to determine the format needed for the proper
 * @user#0000 to appear in chat, this is because DMs to the bot and
 * textChannel messages don't work the same
 * 
 * `textChannel` messages need a snowflake
 * 
 * `dm` messages use just plain text
 * 
 * @export
 * @param {(string | TrackedUser)} input
 * @param {UserRefType} neededInFormat
 * @returns string
 */
export function buildUserChatAt(input: string | TrackedUser, neededInFormat: UserRefType): string {
  if (neededInFormat === UserRefType.snowflake)
    return buildUserWrappedSnowflake(input)
  if (neededInFormat === UserRefType.usernameFull && typeof input === 'object')
    return buildUserFull(input)
}