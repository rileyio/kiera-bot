import * as fs from 'fs'

import { Logger } from '@/utils'

export function read(secretName: string, logger?: Logger.Debug) {
  logger.verbose('fetching secret:', secretName)
  try {
    return fs.readFileSync(`/run/secrets/${secretName}`, 'utf8')
  } catch (err) {
    if (err.code !== 'ENOENT') {
      if (logger) logger.error(`An error occurred while trying to read the secret: ${secretName}. Err: ${err}`)
    } else {
      if (logger) logger.debug(`Could not find the secret, probably not running in swarm mode: ${secretName}. Err: ${err}`)
      if (logger) logger.debug('Trying fallback to .env')
      if (process.env[secretName]) {
        if (logger) logger.warn(`${secretName} should be stored as a secret, fallback to .env occurring`)
        return process.env[secretName]
      }
    }
    return undefined
  }
}
