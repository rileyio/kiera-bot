import { ObjectID } from 'bson'

export class TrackedDecision {
  public readonly _id: ObjectID = new ObjectID()
  public name: string = ''

  /**
   * Description of roll
   * @type {string}
   * @memberof TrackedDecision
   */
  public description: string = ''

  /**
   * Possible outcomes
   * @type {Array<TrackedDecisionOption>}
   * @memberof TrackedDecision
   */
  public options: Array<TrackedDecisionOption> = []

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

  /**
   * Enables or Disables the whole decision
   * @type {boolean}
   * @memberof TrackedDecision
   */
  public enabled: boolean = true

  /**
   * Number of times used
   * @type {number}
   * @memberof Decision
   */
  public counter: number = 0

  constructor(init?: Partial<TrackedDecision>) {
    Object.assign(this, init || {})
    this.options = this.options.map(o => new TrackedDecisionOption(o))
  }
}

export class TrackedDecisionOption {
  public _id: ObjectID = new ObjectID()

  /**
   * Random decision outcome
   * @type {string}
   * @memberof TrackedDecisionOption
   */
  public text: string

  /**
   * Enables or Disables this decision outcome
   * @type {boolean}
   * @memberof TrackedDecisionOption
   */
  public enabled: boolean = true

  /**
   * The type and how to format it when displaying
   * @type {('string' | 'image' | 'url' | 'markdown')}
   * @memberof TrackedDecisionOption
   */
  public type: 'string' | 'image' | 'url' | 'markdown'

  constructor(init: Partial<TrackedDecisionOption>) {
    Object.assign(this, init)
  }
}
