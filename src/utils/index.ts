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
  return msg
    .replace(XRegex(`^\\${process.env.BOT_MESSAGE_PREFIX}`), '')
    .replace(XRegex(`/(?!["][^"]\B)\s+(?![^"]+["]\B)/`, 'g'), ' ')
    .split(/(?!["][^"]\B)\s+(?![^"]+["]\B)/g)
}

export * from './chastikey'
export * from './channel'
export * from './client-event-handler'
export * from './date'
export * from './logger'
export * from './prompt'
export * from '../localization'
export * from './string-builder'
export * from './types'
export * from './user'
export * from './url'
