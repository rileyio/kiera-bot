import { TrackedChastiKey } from './chastikey';
import * as deepExtend from 'deep-extend';
import { ObjectId } from 'bson';

export class TrackedUser {
  public _id: ObjectId
  public accessToken: string
  public avatar: string
  public createdTimestamp: number
  public discriminator: string
  public flags: number
  public id: string
  public isBot: boolean
  public locale: string
  public mfa_enabled: boolean
  public premium_type: number
  public provider: string
  public username: string

  public guilds: Array<{
    owner: boolean
    permissions: number
    icon: string
    id: string
    name: string
    fetchedAt: string
  }>

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