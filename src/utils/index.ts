import * as Channel from './channel'
import * as Logger from './logger'
import * as XRegex from 'xregexp'
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

export * from './client-event-handler'
export * as Date from './date'
// export * from './prompt'
export * from '../localization'
export * from './string-builder'
export * from './types'
export * from './user'
export * from './url'

export { Channel }
export { Logger }