import { Task } from '../task';
import got = require('got');
import { MongoDBLoader, Collections } from '../../db/database';
import { TrackedBotSetting } from '../../objects/setting';

export class ChastiKeyAPIFetchAndStore extends Task {
  public APIEndpoint: string
  public previousRefresh: number = 0
  public dbCollection: Collections
  public isJSON: boolean = true
  public strip: string

  run = this.fetch
  isAsync = true

  // Methods for this task
  protected async fetch() {
    if ((Date.now() - this.previousRefresh) < this.frequency) return true // Block as its too soon
    try {
      // Check in DB when last interval was
      var lastRunSetting = await this.Bot.DB.get<TrackedBotSetting>('settings', { key: `bot.task.chastikey.api.fetch.${this.name}` })
      // If not set or delta is too large continue as normal, else stop from running again too soon like after a bot reboot
      if (lastRunSetting) {
        lastRunSetting = new TrackedBotSetting(lastRunSetting)
        // Update task's last run timestamp
        this.previousRefresh = lastRunSetting.value
        if ((Date.now() - lastRunSetting.value) < this.frequency) return // Stop here
      }
      else {
        lastRunSetting = new TrackedBotSetting({
          added: Date.now(),
          author: 'kiera-bot',
          env: '*',
          key: `bot.task.chastikey.api.fetch.${this.name}`,
        })
      }

      // tslint:disable-next-line:no-console
      console.log(`Task:Fetching => ${this.name}`)
      const response = await got(this.APIEndpoint, { json: (<any>this.isJSON) })

      await this.storeInDB((this.isJSON)
        ? response.body : JSON.parse(response.body.replace(this.strip, '')))
      this.previousRefresh = Date.now()

      // Update DB stored value to track last run
      await this.Bot.DB.update<TrackedBotSetting>('settings',
        { key: `bot.task.chastikey.api.fetch.${this.name}` },
        lastRunSetting.update({ value: Date.now(), lastUpdatd: Date.now() }),
        { upsert: true })

      return true
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log(`Error refreshing ${this.name}`, error)
      // Set the last refresh for now to prevent repeated requests to the server
      this.previousRefresh = Date.now()
      return false
    }
  }

  private async storeInDB(data: any) {
    try {
      // // Remove all old entires with non matching timestamps
      // await this.Bot.DB.remove(this.dbCollection, {}, { deleteOne: false })
      // // Update collection of Running Locks
      // await this.Bot.DB.addMany(this.dbCollection, data, {})
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log('DB store issue', error)
    }
  }
}