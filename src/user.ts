export class TrackedUser {
  public _id: string = undefined
  public id: string
  public username: string
  public createdTimestamp: number
  public bot: boolean

  constructor(init: Partial<TrackedUser>) {
    Object.assign(this, init);
  }
}