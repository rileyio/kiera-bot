import { TrackedChastiKey } from './chastikey';
import * as deepExtend from 'deep-extend';
import * as jwt from 'jsonwebtoken';
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
  public webToken: string

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

  public oauth(initOauth: Partial<TrackedUser> | TrackedUser) {
    Object.assign(this, initOauth)

    // If valid & updated, generate a token for use with Kiera
    this.webToken = jwt.sign({ id: this.id }, process.env.BOT_SECRET, { expiresIn: '3h' });
  }
}

export interface TrackedUserQuery {
  id?: string
  username?: string
  discriminator?: string
}