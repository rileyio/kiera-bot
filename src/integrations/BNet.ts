import { Blizzard, initialize } from 'blizzard.js'

import { Bot } from '#/index'
import { Logger } from '#utils'
import { TrackedBotSetting } from '#objects/setting'

export class BattleNet {
  private Bot: Bot
  private ClientID: string = process.env.BNET_CLIENT_ID
  private ClientSecret: string = process.env.BNET_CLIENT_SECRET
  private ClientAccessToken: string
  private isTokenStored = false
  private isRunningTokenMonitorProcess = false
  private tokenMonitorProcess: NodeJS.Timer
  public DEBUG_BNET: Logger.Debug
  public Client: Blizzard

  public async setup(bot: Bot) {
    this.DEBUG_BNET = new Logger.Debug(`BattleNet`)
    this.DEBUG_BNET.log('🎮 BattleNet -> Setting Up!')
    this.Bot = bot
    // Check DB for Blizzard Access token
    const storedAcceessToken = await this.Bot.DB.get('settings', { key: 'bot.bnet.api.accessToken' })
    this.DEBUG_BNET.log(`🎮 BattleNet -> Token Stored!`)

    // [ Only when DB record is missing ] If Access token is missing fetch one
    if (!storedAcceessToken) {
      this.DEBUG_BNET.log(`🎮 BattleNet -> Token Missing Condition! Fetching new token..`)
      this.isTokenStored = false
      await this.getToken()
    } else {
      this.DEBUG_BNET.log(`🎮 BattleNet -> Token Stored Condition`)
      this.isTokenStored = true
      // [ Only when DB record is null or update date > 20 hours ]
      if (!storedAcceessToken.value || Date.now() - storedAcceessToken.updated > 72000000) {
        this.DEBUG_BNET.log(`🎮 BattleNet -> Token Expected Expired! ( > 20 hours old ), fetching new token..`)
        await this.getToken()
      } else {
        this.DEBUG_BNET.log(`🎮 BattleNet -> Using existing cached token`)
        this.ClientAccessToken = storedAcceessToken.value
        this.initializeClient()
      }
    }

    this.DEBUG_BNET.log('🎮 BattleNet -> Ready')
    // Start Token monitor to auto refresh
    this.tokenMonitor()
  }

  private async getToken() {
    this.initializeClient()
    // Fetch a new token from Blizzard's API
    const resp = await this.Client.getApplicationToken()

    // Store in object
    this.ClientAccessToken = resp.data.access_token

    // Store it in the DB
    if (this.isTokenStored) {
      const update = await this.Bot.DB.update(
        'settings',
        { key: 'bot.bnet.api.accessToken' },
        {
          $set: {
            updated: Date.now(),
            value: resp.data.access_token
          }
        },
        { atomic: true }
      )

      this.DEBUG_BNET.log('🎮 BattleNet -> Updated Token(s): ', update)
    } else {
      await this.Bot.DB.add(
        'settings',
        new TrackedBotSetting({
          added: Date.now(),
          author: 'kiera-bot',
          env: '*',
          key: 'bot.bnet.api.accessToken',
          updated: Date.now(),
          value: resp.data.access_token
        })
      )
    }

    this.isTokenStored = true

    // Re-initialize Client
    this.initializeClient()

    this.DEBUG_BNET.log('🎮 BattleNet -> New Token Secured!')
  }

  private initializeClient() {
    this.Client = initialize({
      key: this.ClientID,
      secret: this.ClientSecret,
      token: this.ClientAccessToken
    })
  }

  private tokenMonitor() {
    if (!this.isRunningTokenMonitorProcess) {
      this.isRunningTokenMonitorProcess = true

      this.tokenMonitorProcess = setInterval(async () => {
        this.DEBUG_BNET.log('🎮 BattleNet -> Auto refreshing token!')
        await this.getToken()
      }, 72000000)
    }
  }
}
