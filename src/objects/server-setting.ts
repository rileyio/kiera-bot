import { ObjectID } from 'bson'

export class TrackedServerSetting {
  public _id: ObjectID
  public key: string
  public serverID: string
  public state: boolean
  public type: string
  public value: string

  constructor(init?: Partial<TrackedServerSetting>) {
    Object.assign(this, init || {})
  }
}
