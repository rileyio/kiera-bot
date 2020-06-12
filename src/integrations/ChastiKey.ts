import * as APIUrls from '@/api-urls'
import got from 'got'
import { Bot } from '@/index'
import { ChastiKey as ChastiKeyAPI } from 'chastikey.js'
import { ChastiKeyVerifyDiscordID, ChastiKeyVerifyResponse } from '@/objects/chastikey'
import FormData = require('form-data')

/**
 * ChastiKey API Helper service
 * @export
 * @class ChastiKey
 */
export class ChastiKey {
  private Bot: Bot
  private ClientID: string = process.env.CLIENTID
  private ClientSecret: string = process.env.CLIENTSECRET
  private RapidAPIKey: string = process.env.RAPIDAPIKEY
  public Client: ChastiKeyAPI
  public monitor: NodeJS.Timer
  public usageSinceLastStartup: number = 0
  public usageLastMinute: number = 0

  constructor(bot: Bot) {
    this.Bot = bot
  }

  private trackUsage() {
    this.usageLastMinute += 1
    this.usageSinceLastStartup += 1
  }

  public async setup() {
    this.Bot.Log.Integration.log('🔒 ChastiKey -> Setting Up!')

    if (this.ClientID && this.ClientSecret && this.RapidAPIKey) {
      this.Client = new ChastiKeyAPI({
        clientID: this.ClientID,
        clientSecret: this.ClientSecret,
        rapidAPIKey: this.RapidAPIKey
      })

      this.Bot.Log.Integration.log('🔒 ChastiKey -> Ready')
    }

    if (!this.monitor) {
      this.monitor = setInterval(() => {
        // Reset usage in this last minute to 0
        this.usageLastMinute = 0
      }, 60000)
    }
  }

  public async fetchAPILockeeData(query: { discordid?: string; username?: string; showDeleted: boolean }) {
    try {
      const resp = await this.Client.LockeeData.get({ username: query.username, discordid: query.discordid, showdeleted: query.showDeleted ? 1 : 0 })
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPILockeeData =>`, query, { response: resp.response, data: resp.data, locks: resp.locks.length })
      this.trackUsage()
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPILockeeData =>`, query, error)
    }
  }

  public async fetchAPIKeyholderData(query: { discordid?: string; username?: string }) {
    try {
      const resp = await this.Client.KeyholderData.get({ username: query.username, discordid: query.discordid })
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPIKeyholderData =>`, query, { response: resp.response, data: resp.data, locks: resp.locks.length })
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPIKeyholderData =>`, query, error)
    }
  }

  public async fetchAPICombinations(query: { discordid?: string; username?: string }) {
    try {
      const resp = await this.Client.Combinations.get({ username: query.username, discordid: query.discordid })
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPICombinations =>`, query, { response: resp.response, locks: resp.locks.length })
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPICombinations =>`, query, error)
    }
  }

  public async fetchAPIUserDataCache() {
    try {
      const resp = await this.Client.UserData.get()
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPIUserDataCache =>`, { response: resp.response, users: resp.users.length })
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPIUserDataCache =>`, error)
    }
  }

  public async fetchAPIRunningLocksDataCache() {
    try {
      const resp = await this.Client.RunningLocks.get()
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPIRunningLocksDataCache =>`, { response: resp.response, users: resp.locks.length })
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPIRunningLocksDataCache =>`, error)
    }
  }

  // Legacy Requests (Some are unique to Kiera)
  public async verifyCKAccountCheck(params: { discordID?: string; username?: string }) {
    try {
      const { body } = await got(
        params.discordID ? `${APIUrls.ChastiKey.VerifyDiscordID}?discord_id=${params.discordID}` : `${APIUrls.ChastiKey.VerifyDiscordID}?username=${params.username}`,
        {
          responseType: 'json'
        }
      )

      const resp = new ChastiKeyVerifyDiscordID(body as ChastiKeyVerifyDiscordID)
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].verifyCKAccountCheck =>`, params)
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].verifyCKAccountCheck =>`, error)
    }
  }

  public async verifyCKAccountGetCode(discordID: string, username: string, discriminator: string) {
    try {
      // Make request out to ChastiKey to start process
      const postData = new FormData()
      postData.append('id', discordID)
      postData.append('username', username)
      postData.append('discriminator', discriminator)

      const { body } = await got.post(APIUrls.ChastiKey.DiscordAuth, { body: postData } as any)
      const resp = new ChastiKeyVerifyResponse(JSON.parse(body as string))

      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].verifyCKAccountGetCode => ${discordID}, ${username}, ${discriminator}`)
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].verifyCKAccountGetCode =>`, error)
    }
  }
}
