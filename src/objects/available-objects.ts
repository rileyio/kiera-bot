import { ObjectID } from 'bson'

export class TrackedAvailableObject {
  public _id: ObjectID
  public key: string
  public serverID: string
  public state: boolean
  public type: string
  public value: string
}
