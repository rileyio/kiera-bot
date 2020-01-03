import * as APIUrls from '@/api-urls'
import * as got from 'got'
import { Bot } from '@/index'
import { Logging } from '@/utils'
import { ChastiKey as ChastiKeyAPI } from 'chastikey.js'
import { ChastiKeyVerifyDiscordID, ChastiKeyVerifyResponse } from '@/objects/chastikey'
import FormData = require('form-data')

/**
 * !Early Testing!
 * TODO: Include ChastiKey/chastikey.js for all bot calls
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
  }

  public async fetchAPILockeeData(query: { discordid?: string; username?: string; showDeleted: boolean }) {
    return await this.Client.LockeeData.get({ username: query.username, discordid: query.discordid, showdeleted: query.showDeleted ? 1 : 0 })
  }
  public async fetchAPIKeyholderData(query: { discordid?: string; username?: string }) {
    return await this.Client.KeyholderData.get({ username: query.username, discordid: query.discordid })
  }
  public async fetchAPICombinations(query: { discordid?: string; username?: string }) {
    return await this.Client.Combinations.get({ username: query.username, discordid: query.discordid })
  }
  public async fetchAPIUserDataCache() {
    return await this.Client.UserData.get()
  }
  public async fetchAPIRunningLocksDataCache() {
    return await this.Client.RunningLocks.get()
  }

  // Legacy Requests (Some are unique to Kiera)
  public async verifyCKAccountCheck(params: { discordID?: string; username?: string }) {
    const { body }: got.Response<ChastiKeyVerifyDiscordID> = await got(
      params.discordID ? `${APIUrls.ChastiKey.VerifyDiscordID}?discord_id=${params.discordID}` : `${APIUrls.ChastiKey.VerifyDiscordID}?username=${params.username}`,
      { json: true }
    )
    return new ChastiKeyVerifyDiscordID(body)
  }
  public async verifyCKAccountGetCode(discordID: string, username: string, discriminator: string) {
    // Make request out to ChastiKey to start process
    const postData = new FormData()
    // Check if verify key has been cached recently
    postData.append('id', discordID)
    postData.append('username', username)
    postData.append('discriminator', discriminator)

    const { body }: got.Response<string> = await got.post(APIUrls.ChastiKey.DiscordAuth, { body: postData } as any)
    return new ChastiKeyVerifyResponse(JSON.parse(body))
  }
}
