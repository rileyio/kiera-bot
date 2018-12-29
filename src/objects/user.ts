import { TrackedChastiKey } from './chastikey';
import * as deepExtend from 'deep-extend';
import { ObjectId } from 'bson';

export class TrackedUser {
  public _id: ObjectId
  public id: string
  public username: string
  public discriminator: string
  public createdTimestamp: number
  public isBot: boolean

  // ChastiKey Specific //
  public ChastiKey: TrackedChastiKey = new TrackedChastiKey({})

  constructor(init: Partial<TrackedUser> | TrackedUser) {
    deepExtend(this, init);
  }
}

export interface TrackedUserQuery {
  id?: string
  username?: string
  discriminator?: string
}