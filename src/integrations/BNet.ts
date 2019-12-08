import { initialize, Blizzard } from 'blizzard.js'
import { Bot } from '..'
import { TrackedBotSetting } from '../objects/setting'
import { Logging } from '../utils'

export class BattleNet {
  private bot: Bot
  private ClientID: string = process.env.BNET_CLIENT_ID
  private ClientSecret: string = process.env.BNET_CLIENT_SECRET
  private ClientAccessToken: string
  private isTokenStored: boolean = false
  private isRunningTokenMonitorProcess: boolean = false
  private tokenMonitorProcess: NodeJS.Timer
  public DEBUG_BNET: Logging.Debug
  public Client: Blizzard

  public async setup(bot: Bot) {
    this.DEBUG_BNET = new Logging.Debug(`BattleNet`)
    this.DEBUG_BNET.log('🎮 BattleNet -> Setting Up!')
    this.bot = bot
    // Check DB for Blizzard Access token
    const storedAcceessToken = await this.bot.DB.get<TrackedBotSetting>('settings', { key: 'bot.bnet.api.accessToken' })
    this.DEBUG_BNET.log(`🎮 BattleNet -> Token Stored = ${JSON.stringify(storedAcceessToken)}`)

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
      const update = await this.bot.DB.update<TrackedBotSetting>('settings', { key: 'bot.bnet.api.accessToken' }, { $set: { value: resp.data.access_token, updated: Date.now() } }, { atomic: true })

      this.DEBUG_BNET.log('🎮 BattleNet -> Updated Token(s): ', update)
    } else {
      await this.bot.DB.add<TrackedBotSetting>(
        'settings',
        new TrackedBotSetting({
          key: 'bot.bnet.api.accessToken',
          added: Date.now(),
          author: 'kiera-bot',
          env: '*',
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
