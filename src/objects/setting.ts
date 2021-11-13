import { ObjectId } from 'bson'

export class TrackedBotSetting {
  public readonly _id?: ObjectId
  public added: number
  public author: 'kiera-bot' | string
  public description?: string
  public env?: string
  public key: string | RegExp
  public updated: number
  public value: any

  constructor(init: Partial<TrackedBotSetting>) {
    this.update(init)
  }

  public update(init: Partial<TrackedBotSetting>) {
    Object.assign(this, init)
    return this
  }
}
