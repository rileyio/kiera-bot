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
    .replace(/(?!["][^"]\B)\s+(?![^"]+["]\B)/g, ' ')
    .split(/(?!["][^"]\B)\s+(?![^"]+["]\B)/g)
}

export * from './chastikey';
export * from './channel';
export * from './date';
export * from './logger';
export * from './react';
export * from '../router/router';
export * from './string-builder';
export * from '../router/validate';
export * from './user';
export * from './url';