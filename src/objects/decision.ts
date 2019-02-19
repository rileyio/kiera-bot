import { ObjectID } from 'bson';

export class TrackedDecision {
  public readonly _id: ObjectID = new ObjectID()
  public name: string = ''
  public options: Array<TrackedDecisionOption> = []
  /**
   * TrackedUser object ID
   * @type {ObjectID}
   * @memberof TrackedDecision
   */
  public owner: ObjectID
  /**
   * Discord Snowflake
   * @type {string}
   * @memberof TrackedDecision
   */
  public authorID: string
  /**
   * Discord Server ID
   * @type {ObjectID}
   * @memberof TrackedDecision
   */
  public serverID: string
  /**
   * Limit the Decision roller to its serverID
   * @type {boolean}
   * @memberof TrackedDecision
   */
  public serverLimited: boolean = false

  constructor(init: Partial<TrackedDecision>) {
    Object.assign(this, init)
    this.options = this.options.map(o => new TrackedDecisionOption(o))
  }
}

export class TrackedDecisionOption {
  public _id: ObjectID = new ObjectID()
  public text: string

  constructor(init: Partial<TrackedDecisionOption>) {
    Object.assign(this, init)
  }
}