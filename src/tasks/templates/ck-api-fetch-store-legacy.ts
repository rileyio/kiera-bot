import got from 'got'
import { Task } from '@/objects/task'
import { Collections } from '@/db'

export class ChastiKeyAPIFetchAndStoreLegacy extends Task {
  public APIEndpoint: string
  public dbCollection: Collections
  public strip: string

  // Config for this task
  run = this.fetch
  schedule = '1,16,31,46 * * * *'
  settingPrefix = 'bot.task.chastikey.api.schedule'

  // Methods for this task
  protected async fetch() {
    // Perform the scheduled task/job
    try {
      console.log(`### Task:Fetching => ${this.name}`)
      const resp = await got(this.APIEndpoint, { responseType: 'json' })

      // Only if resp contains data delete and attempt to save the new cache
      if (resp.statusCode === 200) {
        await this.storeInDB(resp.body)
      }

      this.lastRun = Date.now()

      return true
    } catch (error) {
      console.log(`### Task:Error refreshing ${this.name}`, error)
      // Set the last refresh for now to prevent repeated requests to the server
      this.lastRun = Date.now()
      return false
    }
  }

  private async storeInDB(data: any) {
    try {
      console.log(`Task:${this.name} => Store in DB`)
      // Remove all old entires with non matching timestamps
      await this.Bot.DB.remove(this.dbCollection, {}, { deleteOne: false })
      // Update collection of Running Locks
      await this.Bot.DB.addMany(this.dbCollection, data, {})
    } catch (error) {
      console.log('### Task:DB store issue', error)
    }
  }
}
