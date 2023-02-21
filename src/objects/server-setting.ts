import { ObjectId } from 'bson'

export class StoredServerSetting {
  public _id: ObjectId
  public key: string
  public serverID: string
  public state: boolean
  public type: string
  public value: string

  constructor(init?: Partial<StoredServerSetting>) {
    Object.assign(this, init || {})
  }
}
