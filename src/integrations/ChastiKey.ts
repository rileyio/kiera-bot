import * as APIUrls from '@/api-urls'
import got from 'got'
import { Bot } from '@/index'
import { Logging } from '@/utils'
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
  public DEBUG_CK: Logging.Debug
  public Client: ChastiKeyAPI
  public monitor: NodeJS.Timer
  public usageSinceLastStartup: number = 0
  public usageLastMinute: number = 0

  public async setup(bot: Bot) {
    this.DEBUG_CK = new Logging.Debug(`ChastiKey`)
    this.DEBUG_CK.log('🔒 ChastiKey -> Setting Up!')
    this.Bot = bot

    if (this.ClientID && this.ClientSecret && this.RapidAPIKey) {
      this.Client = new ChastiKeyAPI({
        clientID: this.ClientID,
        clientSecret: this.ClientSecret,
        rapidAPIKey: this.RapidAPIKey
      })

      this.DEBUG_CK.log('🔒 ChastiKey -> Ready')
    }

    if (!this.monitor) {
      this.monitor = setInterval(() => {
        // Reset usage in this last minute to 0
        this.usageLastMinute = 0
      }, 60000)
    }
  }

  public async fetchAPILockeeData(query: { discordid?: string; username?: string; showDeleted: boolean }) {
    const resp = await this.Client.LockeeData.get({ username: query.username, discordid: query.discordid, showdeleted: query.showDeleted ? 1 : 0 })
    this.trackUsage()
    return resp
  }
  public async fetchAPIKeyholderData(query: { discordid?: string; username?: string }) {
    const resp = await this.Client.KeyholderData.get({ username: query.username, discordid: query.discordid })
    this.trackUsage()
    return resp
  }
  public async fetchAPICombinations(query: { discordid?: string; username?: string }) {
    const resp = await this.Client.Combinations.get({ username: query.username, discordid: query.discordid })
    this.trackUsage()
    return resp
  }
  public async fetchAPIUserDataCache() {
    const resp = await this.Client.UserData.get()
    this.trackUsage()
    return resp
  }
  public async fetchAPIRunningLocksDataCache() {
    const resp = await this.Client.RunningLocks.get()
    this.trackUsage()
    return resp
  }

  // Legacy Requests (Some are unique to Kiera)
  public async verifyCKAccountCheck(params: { discordID?: string; username?: string }) {
    const { body } = await got(
      params.discordID ? `${APIUrls.ChastiKey.VerifyDiscordID}?discord_id=${params.discordID}` : `${APIUrls.ChastiKey.VerifyDiscordID}?username=${params.username}`,
      {
        responseType: 'json'
      }
    )

    const resp = new ChastiKeyVerifyDiscordID(body as ChastiKeyVerifyDiscordID)
    this.trackUsage()
    return resp
  }
  public async verifyCKAccountGetCode(discordID: string, username: string, discriminator: string) {
    // Make request out to ChastiKey to start process
    const postData = new FormData()
    // Check if verify key has been cached recently
    postData.append('id', discordID)
    postData.append('username', username)
    postData.append('discriminator', discriminator)

    const { body } = await got.post(APIUrls.ChastiKey.DiscordAuth, { body: postData } as any)
    const resp = new ChastiKeyVerifyResponse(JSON.parse(body as string))
    
    this.trackUsage()
    return resp
  }

  private trackUsage() {
    this.usageLastMinute += 1
    this.usageSinceLastStartup += 1
  }
}
