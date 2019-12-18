import { Bot } from '@/index'

export class Task {
  protected Bot: Bot
  /**
   * Set the target method to run when the task is called
   * @type {string}
   * @memberof Task
   */
  public run: () => Promise<boolean>
  public frequency: number
  public lastRun: number
  public isAsync: boolean = false
  public name: string

  constructor(bot: Bot) {
    this.Bot = bot
  }
}
