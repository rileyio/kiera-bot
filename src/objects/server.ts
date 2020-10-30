import { Guild } from 'discord.js'
import { ObjectId } from 'bson'

export class TrackedServer {
  public _id: ObjectId
  public id: string
  public region: string
  public ownerID: string
  public joinedTimestamp: number
  public enabled: { ChastiKey: boolean } = { ChastiKey: false }
  public prefix?: string

  constructor(init: (TrackedServer | Guild) & Partial<TrackedServer>) {
    this._id = init._id
    this.id = init.id
    this.region = init.region
    this.ownerID = init.ownerID
    this.joinedTimestamp = init.joinedTimestamp
    this.prefix = init.prefix
  }
}
