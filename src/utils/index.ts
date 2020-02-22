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
    .replace(new RegExp(`^\\${process.env.BOT_MESSAGE_PREFIX}`), '')
    .replace(/(?!["][^"]\B)\s+(?![^"]+["]\B)/gi, ' ')
    .split(/(?!["][^"]\B)\s+(?![^"]+["]\B)/gi)
}

export * from './chastikey'
export * from './channel'
export * from './client-event-handler'
export * from './date'
export * from './logger'
export * from './react'
export * from './string-builder'
export * from './types'
export * from './user'
export * from './url'
