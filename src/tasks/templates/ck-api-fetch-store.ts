import { Task } from '../task';
import got = require('got');
import { MongoDBLoader, Collections } from '../../db/database';

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
      // tslint:disable-next-line:no-console
      console.log(`Task:Fetching => ${this.name}`)
      const response = await got(this.APIEndpoint, { json: (<any>this.isJSON) })

      await this.storeInDB((this.isJSON)
        ? response.body : JSON.parse(response.body.replace(this.strip, '')))
      this.previousRefresh = Date.now()
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
      // Get timestamp from current 1st position lock as they all share the same
      const db = await MongoDBLoader()
      // Remove all old entires with non matching timestamps, these are old locks no longer
      // returned by the api
      await db.remove(this.dbCollection, {}, { deleteOne: false })
      // Update collection of Running Locks
      await db.addMany(this.dbCollection, data, {})
      await db.connection.client.close()
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log('DB store issue', error)
    }
  }
}