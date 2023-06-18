import { Bot } from '#/index'
import { EventEmitter } from 'events'
import { MongoDBLoader } from '#db'
import { performance } from 'perf_hooks'

export class DatabaseMonitor extends EventEmitter {
  private Bot: Bot
  private monitorInterval: NodeJS.Timer
  public isWaiting = false
  public isMonitorRunning = false
  public pingCount = 0
  public pingFailedCount = 0
  public pingTotalLatency = 0
  public lastPoll: number
  public lastPingStart: number
  public lastPingEnd: number
  public lastPingTime: number

  constructor(bot: Bot) {
    super()
    this.Bot = bot
  }

  public async start() {
    // If no DB is defined yet, start the MongoDBLoader to create one
    if (!this.Bot.DB) this.Bot.DB = await MongoDBLoader(this.Bot)
    // Return DB Monitor & start first new connection
    return await this.monitor()
  }

  public destroy() {
    clearInterval(this.monitorInterval)
  }

  public async monitor() {
    // Block dup
    if (this.isMonitorRunning) return

    this.Bot.Log.Database.log('connecting to database...')

    this.isMonitorRunning = true
    this.monitorInterval = setInterval(async () => {
      await this.pingDB()
    }, 5000)
    // Trigger 1 ping to start with for startup
    return await this.pingDB()
  }

  private async pingDB() {
    let success = false
    // Check if a ping is hanging, don't let it pool them
    if (this.isWaiting) return
    this.isWaiting = true
    try {
      // track performance
      this.lastPingStart = performance.now()
      const _ping = await this.Bot.DB.ping()

      if (_ping) {
        this.lastPingEnd = performance.now()
        this.lastPingTime = Math.round(this.lastPingEnd - this.lastPingStart)
        this.pingTotalLatency += this.lastPingTime
        this.pingCount += 1
        this.pingFailedCount = 0 // reset
        success = true

        // console.log('***** ping', _ping, Math.round(this.pingTotalLatency / this.pingCount), 'ms')
      } else {
        this.pingFailedCount += 1
        success = false

        // console.log('$$$$$ ping FAILED')
      }
    } catch (error) {
      this.pingFailedCount += 1
      success = false

      // console.log('$$$$$ ping FAILED')
    }
    // Update flag to allow next loop to ping without blocking
    this.isWaiting = false

    // Emit event for current status
    this.emitUpdate(success ? 'dbPingSuccessful' : 'dbPingFailed', success ? this.lastPingEnd : undefined, success ? Math.round(this.pingTotalLatency / this.pingCount) : undefined)

    // Return success status
    return success
  }

  private emitUpdate(event: 'dbPingSuccessful' | 'dbPingFailed', time?: number, avg?: number) {
    this.emit(event, time, avg)
  }
}
