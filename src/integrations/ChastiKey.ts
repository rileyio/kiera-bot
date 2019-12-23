import { Bot } from '@/index'
import { Logging } from '@/utils'
import { ChastiKey as ChastiKeyAPI } from 'chastikey.js'

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
}
