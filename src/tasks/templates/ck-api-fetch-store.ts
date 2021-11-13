import { Collections } from '@/db'
import { Task } from '@/objects/task'

export type ChastiKeyAPIFetchAndStoreMethod = 'fetchAPIUserDataCache' | 'fetchAPIRunningLocksDataCache'
export type ChastiKeyAPIFetchAndStoreArray = 'locks' | 'users'

export class ChastiKeyAPIFetchAndStore extends Task {
  public reload = true
  public dbCollection: keyof Collections
  public method: ChastiKeyAPIFetchAndStoreMethod
  public respArray: ChastiKeyAPIFetchAndStoreArray

  // Config for this task
  run = this.fetch
  schedule = '1,11,21,31,41,51 * * * *'
  settingPrefix = 'bot.task.chastikey.api.schedule'

  protected async fetch() {
    // Perform the scheduled task/job
    try {
      console.log(`### Task:Fetching => ${this.name}`)
      const resp = await this.Bot.Service.ChastiKey[this.method]()
      // Only if resp contains data delete and attempt to save the new cache
      if (resp.response.status === 200 && resp[this.respArray].length > 0) {
        await this.storeInDB(resp[this.respArray])
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
