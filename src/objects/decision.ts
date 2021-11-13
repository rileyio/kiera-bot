import { ObjectId } from 'bson'

export class TrackedDecision {
  public readonly _id: ObjectId

  public nickname?: string
  public name = ''

  /**
   * Description of roll
   * @type {string}
   * @memberof TrackedDecision
   */
  public description = ''

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
   * @type {ObjectId}
   * @memberof TrackedDecision
   */
  public serverID: string

  /**
   * Permissions mode
   * @type {('All' | 'None' | 'Whitelist')}
   * @memberof TrackedDecision
   */
  public usagePermission: 'All' | 'None' | 'Whitelist' = 'All'

  /**
   * Enables or Disables the whole decision
   * @type {boolean}
   * @memberof TrackedDecision
   */
  public enabled = true

  /**
   * Number of times used
   * @type {number}
   * @memberof Decision
   */
  public counter = 0

  public serverWhitelist: Array<string> = []
  public userWhitelist: Array<string> = []
  public userBlacklist: Array<string> = []

  /**
   * Users who are allowed to Edit all properties & outcomes on a decision.
   *   Limit: They cannot delete a decision on the owner
   * @type {Array<string>}
   * @memberof TrackedDecision
   */
  public managers: Array<string> = []

  public log?: Array<TrackedDecisionLogEntry>

  public consumeMode: 'Basic' | 'Temporarily Consume' | 'Consume' = 'Basic'
  public consumeReset = 0 // Seconds

  constructor(init?: Partial<TrackedDecision>) {
    Object.assign(this, init || {})
    this.options = this.options.map((o) => new TrackedDecisionOption(o))
  }
}

export class TrackedDecisionOption {
  public _id: ObjectId = new ObjectId()

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
  public enabled = true

  /**
   * The type and how to format it when displaying
   * @type {('string' | 'image' | 'url' | 'markdown')}
   * @memberof TrackedDecisionOption
   */
  public type: 'string' | 'image' | 'url' | 'markdown'

  public consumed?: boolean = false
  public consumedTime?: number = 0

  constructor(init: Partial<TrackedDecisionOption>) {
    Object.assign(this, init)
  }
}

export class TrackedDecisionLogEntry {
  public _id: ObjectId | string
  public callerID: string
  public decisionID: string
  public outcomeID: string
  public serverID?: string
  public channelID: string
  public outcomeContent: string

  constructor(init?: Partial<TrackedDecisionLogEntry>) {
    Object.assign(this, init || {})
  }
}
