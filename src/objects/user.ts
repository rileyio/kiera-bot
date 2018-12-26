import { TrackedChastiKey } from "./chastikey";
import * as deepExtend from 'deep-extend';

export class TrackedUser {
  public _id: string
  public id: string
  public username: string
  public discriminator: string
  public createdTimestamp: number
  public isBot: boolean

  // ChastiKey Specific //
  public ChastiKey: TrackedChastiKey = new TrackedChastiKey({})

  constructor(init: Partial<TrackedUser>) {
    deepExtend(this, init);
  }
}