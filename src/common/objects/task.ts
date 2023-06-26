import { Agenda } from 'agenda'
import { Bot } from '#/index'
import { TrackedBotSetting } from './setting.ts'

export class Task {
  public Agenda: Agenda
  public Bot: Bot
  /**
   * Set the target method to run when the task is called
   * @type {string}
   * @memberof Task
   */
  public run: () => Promise<boolean>
  public name: string
  public lastRun: number
  public schedule: string
  public settingPrefix: string

  public async setupAgenda() {
    // Get the schedule from the DB - this allow's for dynamic changes without re-writing code
    let dbSchedule = await this.Bot.DB.get('settings', { key: `${this.settingPrefix}.${this.name}` })
    // If there is a schedule configured in the DB
    if (dbSchedule) this.schedule = dbSchedule.value
    // When no Schedule is configured in the DB, make one to have
    else {
      dbSchedule = new TrackedBotSetting({
        added: Date.now(),
        author: 'kiera-bot',
        env: '*',
        key: `${this.settingPrefix}.${this.name}`,
        updated: Date.now(),
        value: this.schedule
      })
    }

    // Store new schedule
    await this.Bot.DB.update('settings', { key: `${this.settingPrefix}.${this.name}` }, dbSchedule, { upsert: true })

    // Agenda scheduler
    this.Agenda.define(this.name, async (job) => {
      await this.run()
    })
    await this.Agenda.every(this.schedule, this.name) // '0 * * * *'
  }
}
