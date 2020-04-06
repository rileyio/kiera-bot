import { GuildEmoji } from 'discord.js'

export class TrackedEmoji {
  public _id: string
  public id: string
  public animated: boolean
  public createdTimestamp: number
  public deletable: boolean
  public identifier: string
  public name: string
  public roles: number
  public url: boolean

  constructor(init: Partial<TrackedEmoji | GuildEmoji>) {
    Object.assign(this, {
      id: init.id,
      animated: init.animated,
      createdTimestamp: init.createdTimestamp,
      deletable: init.deletable,
      identifier: init.identifier,
      name: init.name,
      roles: init.roles,
      url: init.url
    })
  }
}
