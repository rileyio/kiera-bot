import { Channel, TextChannel } from 'discord.js'

export class TrackedChannel {
  public _id: string
  public id: string
  public createdTimestamp: number
  public name: string
  public parentID: string
  public type: string

  constructor(init: Partial<TrackedChannel | Channel | TextChannel>) {
    Object.assign(this, {
      id: init.id,
      createdTimestamp: init.createdTimestamp,
      name: (<TextChannel>init).name,
      parentID: (<TextChannel>init).parentID,
      type: init.type
    })
  }
}
