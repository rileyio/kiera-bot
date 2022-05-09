import { ObjectId } from 'bson'

export class TrackedServer {
  public _id: ObjectId
  public id: string
  public region: string
  public ownerID: string
  public name: string
  public joinedTimestamp: number
  public lastSeen?: number
  public prefix?: string

  constructor(init: Partial<TrackedServer>) {
    Object.assign(this, init || {})
  }
}
