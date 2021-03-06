import * as Agenda from 'agenda'
import { Bot } from '@/index'
import { TrackedBotSetting } from './setting'

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

  public setupAgenda() {
    ;(async () => {
      // Get the schedule from the DB - this allow's for dynamic changes without re-writing code
      var dbSchedule = await this.Bot.DB.get<TrackedBotSetting>('settings', { key: `${this.settingPrefix}.${this.name}` })
      // If there is a schedule configured in the DB
      if (dbSchedule) this.schedule = dbSchedule.value
      // When no Schedule is configured in the DB, make one to have
      else {
        dbSchedule = new TrackedBotSetting({
          added: Date.now(),
          author: 'kiera-bot',
          env: '*',
          key: `${this.settingPrefix}.${this.name}`,
          value: this.schedule,
          updated: Date.now()
        })
      }

      // Store new schedule
      await this.Bot.DB.update<TrackedBotSetting>('settings', { key: `${this.settingPrefix}.${this.name}` }, dbSchedule, { upsert: true })

      // Agenda scheduler
      this.Agenda.define(this.name, async job => {
        await this.run()
      })
      await this.Agenda.every(this.schedule, this.name) // '0 * * * *'
    })()
  }
}
