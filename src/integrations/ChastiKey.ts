import * as APIUrls from '@/api-urls'

import { ChastiKeyVerifyDiscordID, ChastiKeyVerifyResponse } from '@/objects/chastikey'

import { Bot } from '@/index'
import { ChastiKey as ChastiKeyAPI } from 'chastikey.js'
import { read as getSecret } from '@/secrets'
import got from 'got'

import FormData = require('form-data')

/**
 * ChastiKey API Helper service
 * @export
 * @class ChastiKey
 */
export class ChastiKey {
  private Bot: Bot
  private ClientID: string
  private ClientSecret: string
  private RapidAPIKey: string
  public Client: ChastiKeyAPI
  public monitor: NodeJS.Timer
  public usageSinceLastStartup = 0
  public usageLastMinute = 0

  constructor(bot: Bot) {
    this.Bot = bot
    this.ClientID = getSecret('CK_CLIENTID', this.Bot.Log.Integration)
    this.ClientSecret = getSecret('CK_CLIENTSECRET', this.Bot.Log.Integration)
    this.RapidAPIKey = getSecret('CK_RAPIDAPIKEY', this.Bot.Log.Integration)
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
      const resp = await this.Client.LockeeData.get({
        discordid: query.discordid,
        showdeleted: query.showDeleted ? 1 : 0,
        username: query.username
      })
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPILockeeData =>`, query, {
        data: resp.data,
        locks: resp.locks.length,
        response: resp.response
      })
      this.trackUsage()
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPILockeeData =>`, query, error)
    }
  }

  public async fetchAPIKeyholderData(query: { discordid?: string; username?: string }) {
    try {
      const resp = await this.Client.KeyholderData.get({
        discordid: query.discordid,
        username: query.username
      })
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPIKeyholderData =>`, query, {
        data: resp.data,
        locks: resp.locks.length,
        response: resp.response
      })
      return resp
    } catch (error) {
      this.Bot.Log.Integration.error(`[ChastiKey].fetchAPIKeyholderData =>`, query, error)
    }
  }

  public async fetchAPICombinations(query: { discordid?: string; username?: string }) {
    try {
      const resp = await this.Client.Combinations.get({
        discordid: query.discordid,
        username: query.username
      })
      this.trackUsage()
      this.Bot.Log.Integration.debug(`[ChastiKey].fetchAPICombinations =>`, query, {
        locks: resp.locks.length,
        response: resp.response
      })
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
