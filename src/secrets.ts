import * as fs from 'fs'
import * as path from 'path'
import * as url from 'url'

import { Logger } from '#utils'
import isDocker from 'is-docker'

export function read(secretName: string, logger: Logger.Debug) {
  const isInDocker = isDocker()
  // Detcted running in docker
  if (isInDocker) logger.log('Detected running in docker.. switching how secrets are read')

  // Inform console which secret is being fetched
  logger.verbose('fetching secret:', secretName)

  try {
    // Mode: Docker Container
    if (isInDocker) return fs.readFileSync(`/run/secrets/${secretName}`, 'utf8')

    // Fallback: Local Development
    return fs.readFileSync(path.join(url.fileURLToPath(new URL('.', import.meta.url)), `../secrets/${secretName}`), 'utf8')
  } catch (err) {
    if (err.code !== 'ENOENT') logger.error(`An error occurred while trying to read the secret: ${secretName}. Err: ${err}`)
    else {
      if (isInDocker) logger.debug(`Could not find the secret, probably not running in swarm mode: ${secretName}. Err: ${err}`)
      else logger.debug(`Could not find the secret, maybe file does not exist? ${secretName}. Err: ${err}`)

      logger.debug('Trying fallback to .env')
      if (process.env[secretName]) {
        if (logger) logger.warn(`${secretName} should be stored as a secret, fallback to .env occurring`)
        return process.env[secretName]
      }
    }
    return undefined
  }
}
