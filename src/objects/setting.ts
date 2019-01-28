import { ObjectID } from 'bson';

export class TrackedBotSetting {
  public readonly _id: ObjectID
  public added: number
  public author: 'kiera-bot' | string
  public description: string
  public env?: string
  public key: string
  public lastUpdatd: number
  public value: any

  constructor(init: Partial<TrackedBotSetting>) {
    this.update(init)
  }

  public update(init: Partial<TrackedBotSetting>) {
    Object.assign(this, init)
    return this
  }
}
