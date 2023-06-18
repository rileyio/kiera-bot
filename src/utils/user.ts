import * as XRegex from 'xregexp'

import { GuildMember } from 'discord.js'
import { TrackedUserQuery } from '#objects/user/index'

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
    return {
      discriminator: match['discriminator'],
      username: match['username']
    }
  }
}

/**
 * Builds a DM specific @user#0000 because DMs don't use snowflakes
 * @export
 * @param {TrackedUser} user
 * @returns string
 */
export function buildUserFull(user: GuildMember): string {
  return `@${user.nickname || user.user.username}#${user.user.discriminator}`
}

/**
 * Builds an in-chat snowflake reference to properly trigger the @user
 * @export
 * @param {(string | GuildMember)} user
 * @returns string
 */
export function buildUserWrappedSnowflake(user: string | GuildMember): string {
  // Catch if incoming is already a snowflake
  if (typeof user === 'string') {
    if (XRegex('^\\<\\@[0-9]*\\>$', 'i').test(user)) return user
  }
  // Regular processing
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
 * @param {(string | GuildMember)} input
 * @param {UserRefType} neededInFormat
 * @returns string
 */
export function buildUserChatAt(input: string | GuildMember, neededInFormat: UserRefType): string {
  if (neededInFormat === UserRefType.snowflake) return buildUserWrappedSnowflake(input)
  if (neededInFormat === UserRefType.usernameFull && typeof input === 'object') return buildUserFull(input)
}
