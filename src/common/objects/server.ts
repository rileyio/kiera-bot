import { ObjectId } from 'bson'

export type StoredServerType = 'discord' | 'placeholder'
export type StoredServercommandGroups = Record<`command/${StoredServerType}/${string}`, boolean>

export class StoredServer {
  public _id?: ObjectId
  public commandGroups?: StoredServercommandGroups
  public id: string
  public ownerID: string
  public name: string
  public joinedTimestamp: number
  public lastSeen: number
  public type: StoredServerType

  constructor(init: StoredServer) {
    if (init._id !== undefined) this._id = new ObjectId(init._id)
    if (init.commandGroups !== undefined) this.commandGroups = { ...this.commandGroups, ...init.commandGroups }
    this.id = init.id === undefined ? this.id : init.id
    this.ownerID = init.ownerID === undefined ? this.ownerID : init.ownerID
    this.name = init.name === undefined ? this.name : init.name
    this.joinedTimestamp = init.joinedTimestamp === undefined ? this.joinedTimestamp : init.joinedTimestamp
    this.lastSeen = init.lastSeen === undefined ? this.lastSeen : init.lastSeen
    this.type = init.type === undefined ? this.type : init.type
  }
}
