import { MongoDB, MongoDBLoader } from './database';
import { EventEmitter } from 'events';
import { performance } from 'perf_hooks'

export class DatabaseMonitor extends EventEmitter {
  private monitorInterval: NodeJS.Timer
  public db: MongoDB<any>
  public isWaiting: boolean = false
  public isMonitorRunning: boolean = false
  public pingCount: number = 0
  public pingFailedCount: number = 0
  public pingTotalLatency: number = 0
  public lastPoll: number
  public lastPingStart: number
  public lastPingEnd: number
  public lastPingTime: number

  constructor() {
    super()
  }

  public async start() {
    if (!this.db) this.db = await MongoDBLoader('server')
    return await this.monitor()
  }

  public destroy() {
    clearInterval(this.monitorInterval)
  }

  public async monitor() {
    // Block dup
    if (this.isMonitorRunning) return;

    this.isMonitorRunning = true
    this.monitorInterval = setInterval(async () => { await this.pingDB() }, 5000)
    // Trigger 1 ping to start with for startup
    return await this.pingDB()
  }

  private async pingDB() {
    var success = false
    // Check if a ping is hanging, don't let it pool them
    if (this.isWaiting) return;
    this.isWaiting = true
    try {
      // track performance
      this.lastPingStart = performance.now()
      const _ping = await this.db.ping()

      if (_ping) {
        this.lastPingEnd = performance.now()
        this.lastPingTime = Math.round(this.lastPingEnd - this.lastPingStart)
        this.pingTotalLatency += this.lastPingTime
        this.pingCount += 1
        this.pingFailedCount = 0 // reset
        success = true
        // tslint:disable-next-line:no-console
        // console.log('***** ping', _ping, Math.round(this.pingTotalLatency / this.pingCount), 'ms')
      }
      else {
        this.pingFailedCount += 1
        success = false
        // tslint:disable-next-line:no-console
        // console.log('$$$$$ ping FAILED')
      }
    } catch (error) {
      this.pingFailedCount += 1
      success = false
      // tslint:disable-next-line:no-console
      // console.log('$$$$$ ping FAILED')
    }
    // Update flag to allow next loop to ping without blocking
    this.isWaiting = false

    // Emit event for current status
    this.emitUpdate(
      success ? 'dbPingSuccessful' : 'dbPingFailed',
      success ? this.lastPingEnd : undefined,
      success ? Math.round(this.pingTotalLatency / this.pingCount) : undefined)

    // Return success status
    return success
  }

  private emitUpdate(event: 'dbPingSuccessful' | 'dbPingFailed', time?: number, avg?: number) {
    this.emit(event, time, avg)
  }
}