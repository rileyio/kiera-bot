import { Bot } from '@/index'
import { ChastiSafeUser } from '@/objects/chastisafe'
import { User } from 'discord.js'
import { read as getSecret } from '@/secrets'
import got from 'got'

/**
 * ChastiSafe API Helper service
 * @export
 * @class ChastiSafeey
 */
export class ChastiSafe {
  private Bot: Bot
  private BotSecret: string
  public monitor: NodeJS.Timer
  public usageSinceLastStartup = 0
  public usageLastMinute = 0
  public url = 'https://chastisafe.com/api-v1'

  constructor(bot: Bot) {
    this.Bot = bot
    this.BotSecret = getSecret('CS_SECRET', this.Bot.Log.Integration)
  }

  private trackUsage() {
    this.usageLastMinute += 1
    this.usageSinceLastStartup += 1
  }

  public async setup() {
    this.Bot.Log.Integration.log('🔒 ChastiSafe -> Setting Up!')

    if (this.BotSecret) {
      this.Bot.Log.Integration.log('🔒 ChastiSafe -> Ready')
    }

    if (!this.monitor) {
      this.monitor = setInterval(() => {
        // Reset usage in this last minute to 0
        this.usageLastMinute = 0
      }, 60000)
    }
  }

  // public async fetchAPILockeeData(query: { discordid?: string; username?: string; showDeleted: boolean }) {
  //   try {
  //     const resp = await this.Client.LockeeData.get({
  //       discordid: query.discordid,
  //       showdeleted: query.showDeleted ? 1 : 0,
  //       username: query.username
  //     })
  //     this.Bot.Log.Integration.debug(`[ChastiSafe].fetchAPILockeeData =>`, query, {
  //       data: resp.data,
  //       locks: resp.locks.length,
  //       response: resp.response
  //     })
  //     this.trackUsage()
  //     return resp
  //   } catch (error) {
  //     this.Bot.Log.Integration.error(`[ChastiSafe].fetchAPILockeeData =>`, query, error)
  //   }
  // }

  public async fetchProfile(idOrUsername: string) {
    try {
      console.log('idOrUsername', idOrUsername)
      const containsSeparator = typeof idOrUsername === 'string' && idOrUsername !== undefined ? idOrUsername.includes('#') : false
      if (containsSeparator) console.log('Detected written username', `'${idOrUsername}'`)
      console.log('uri', `${this.url}/profile/${containsSeparator ? encodeURIComponent(containsSeparator) : idOrUsername}`)
      const { body } = await got.get(`${this.url}/profile/${containsSeparator ? encodeURIComponent(idOrUsername) : idOrUsername}`, {
        headers: {
          chastisafebot: String(this.BotSecret)
        }
        // responseType: 'json'
      })
      console.log('body', body)

      return body === 'User not found' ? null : new ChastiSafeUser(JSON.parse(body))
    } catch (error) {
      this.Bot.Log.Integration.error('Fatal error performing lookup')
      return null
    }
  }
}
