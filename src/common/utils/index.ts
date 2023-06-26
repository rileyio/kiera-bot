import * as Channel from './channel.ts'
import * as Logger from './logger.ts'
import XRegex from 'xregexp'
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
  return msg.replace(XRegex(`/(?!["][^"]\B)\s+(?![^"]+["]\B)/`, 'g'), ' ').split(/(?!["][^"]\B)\s+(?![^"]+["]\B)/g)
}

export * from './client-event-handler.ts'
// export * from './prompt'
export * from './date.ts'
export * from '../../localization.ts'
export * from './string-builder.ts'
export * as Types from './types.ts'
export * as User from './user.ts'
export * as URL from './url.ts'

export { Channel }
export { Logger }
