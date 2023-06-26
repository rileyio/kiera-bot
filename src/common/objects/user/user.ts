import * as jwt from 'jsonwebtoken'

import { ObjectId } from 'bson'

export class TrackedUser {
  public __notStored?: boolean
  public _id?: ObjectId
  public accessToken?: string
  public refreshToken?: string
  public id: string
  public webToken?: string
  public locale?: string = process.env.BOT_LOCALE

  // Decision Preferences //
  public Decision?: TrackedUserDecisionPrefs

  constructor(init: Partial<TrackedUser>) {
    Object.assign(this, init)
    this.Decision = new TrackedUserDecisionPrefs(init !== null ? init.Decision : {})
  }

  public oauth(initOauth: Partial<TrackedUser> | TrackedUser) {
    Object.assign(this, initOauth)

    // If valid & updated, generate a token for use with Kiera
    this.webToken = jwt.sign({ id: this.id }, process.env.BOT_SECRET, { expiresIn: '3h' })
  }

  // public reduceServers(connectedGuilds: Array<TrackedServer>) {
  //   this.guilds = this.guilds.filter(g => connectedGuilds.findIndex(gg => gg.id === g.id) > -1)
  // }
}

export class TrackedUserDecisionPrefs {
  public nickname?: string

  constructor(init: Partial<TrackedUserDecisionPrefs>) {
    Object.assign(this, init)
  }
}

export interface TrackedUserQuery {
  id?: string
  username?: string
  discriminator?: string
}

export class TrackedMutedUser {
  public _id: ObjectId
  public id: string
  public username: string
  public discriminator: string
  public nickname: string
  public serverID: string
  public timestamp: number = Date.now()
  public reason: string
  public mutedById: string
  public mutedByUsername: string
  public mutedByDiscriminator: string
  public removeAt = 0
  public removedAt: number
  public removedBy: string
  public roles: Array<{ id: string; name: string }> = []
  public active = true

  constructor(init: Partial<TrackedMutedUser>) {
    Object.assign(this, init)
  }
}
