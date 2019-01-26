import * as got from 'got';
import { Task } from './task';
import { TrackedChastiKeyLock } from '../objects/chastikey';
import { MongoDBLoader } from '../db/database';
import { Bot } from '..';

export class ChastiKeyAPIRunningLocks extends Task {
  public APIEndpoint = `https://chastikey.com/json/v1.0/running_locks.json`
  public data: Array<TrackedChastiKeyLock> = []
  public previousRefresh: number = 0

  // Setting the props for this Task
  name = 'ChastiKeyAPIRunningLocks'
  frequency = 3600000 // 30 minutes (this is the refresh rate of this data)
  run = this.fetch
  isAsync = true

  // Methods for this task
  protected async fetch() {
    if ((Date.now() - this.previousRefresh) < this.frequency) return true // Block as its too soon
    try {
      const response = await got(this.APIEndpoint, { json: true })
      this.data = response.body
      await this.storeInDB()
      this.previousRefresh = Date.now()
      return true
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log('Error refreshing ChastiKeyAPIRunningLocks', error)
      return false
    }
  }

  private async storeInDB() {
    try {
      // Get timestamp from current 1st position lock as they all share the same
      const timestampNow = this.data[0].timestampNow
      const db = await MongoDBLoader()
      // Update collection of Running Locks
      await db.addMany('ck-running-locks', this.data, {})
      // Remove all old entires with non matching timestamps, these are old locks no longer
      // returned by the api
      await db.remove('ck-running-locks', { timestampNow: { $lt: timestampNow } }, { deleteOne: false })
      await db.connection.client.close()
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log('DB store issue', error)
    }
  }
}