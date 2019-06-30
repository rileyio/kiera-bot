import { initialize, Blizzard } from 'blizzard.js';
import { Bot } from '.';
import { TrackedBotSetting } from './objects/setting';

export class BattleNet {
  private bot: Bot
  private ClientID: string = process.env.BNET_CLIENT_ID
  private ClientSecret: string = process.env.BNET_CLIENT_SECRET
  private ClientAccessToken: string
  private isTokenStored: boolean = false
  public Client: Blizzard

  public async setup(bot: Bot) {
    console.log('BattleNet -> Setting Up!')

    this.bot = bot
    // Check DB for Blizzard Access token
    var storedAcceessToken = await this.bot.DB.get<TrackedBotSetting>('settings', { key: 'bot.bnet.api.accessToken' })

    // [ Only when DB record is missing ] If Access token is missing fetch one
    if (!storedAcceessToken) {
      this.isTokenStored = false
      await this.getToken()
    }
    else {
      this.isTokenStored = true
      // [ Only when DB record is null or update date > 15 days ]
      if (!storedAcceessToken.value || Date.now() - storedAcceessToken.updated > 1296000000) {
        await this.getToken()
      }
      else {
        this.ClientAccessToken = storedAcceessToken.value
        this.initializeClient()
      }
    }

    console.log('BattleNet -> Ready')
  }

  private async getToken() {
    this.initializeClient()
    // Fetch a new token from Blizzard's API
    const resp = await this.Client.getApplicationToken()

    // Store it in the DB
    if (this.isTokenStored) {
      console.log('BattleNet -> Updated Token(s): ', await this.bot.DB.update<TrackedBotSetting>('settings',
        { key: 'bot.bnet.api.accessToken' },
        { $set: { value: resp.data.access_token, updated: Date.now() } },
        { atomic: true }))
    }
    else {
      await this.bot.DB.add<TrackedBotSetting>('settings', new TrackedBotSetting({
        key: 'bot.bnet.api.accessToken',
        added: Date.now(),
        author: 'kiera-bot',
        env: '*',
        updated: Date.now(),
        value: this.ClientAccessToken
      }))
    }

    this.isTokenStored = true

    // Re-initialize Client
    this.initializeClient()

    console.log('BattleNet -> New Token Secured!')
  }

  private initializeClient() {
    this.Client = initialize({
      key: this.ClientID,
      secret: this.ClientSecret,
      token: this.ClientAccessToken
    })
  }
}