import { User } from 'discord.js'
import { performance } from 'perf_hooks'

export class RouterStats {
  private _performanceStart: number = performance.now()
  private _discordUser: User

  public get performance(): number {
    return Math.round(performance.now() - this._performanceStart)
  }

  /**
   * Example: Emma#1366
   * @readonly
   * @type {string}
   * @memberof RouterStats
   */
  public get user(): string {
    return `${this._discordUser.username}#${this._discordUser.discriminator}`
  }

  constructor(author: User) {
    this._discordUser = author
  }
}
