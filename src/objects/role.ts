import { Role } from 'discord.js'

export class TrackedRole {
  public _id: string
  public id: string
  public name: string
  public color: number
  public position: number
  public permissions: number
  public mentionable: boolean

  constructor(init: Partial<TrackedRole | Role>) {
    Object.assign(this, {
      id: init.id,
      name: init.name,
      color: init.color,
      position: init.position,
      permissions: init.permissions,
      mentionable: init.mentionable
    })
  }
}
