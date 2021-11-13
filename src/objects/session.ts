import * as crypto from 'crypto-js'

import { ObjectId } from 'bson'

export class TrackedSession {
  public readonly _id: ObjectId

  /**
   * Discord User ID (Snowflake)
   * @type {string}
   * @memberof Session
   */
  public userID = ''

  /**
   * Session token
   * @type {string}
   * @memberof Session
   */
  public session = ''

  /**
   * When the session is set to expire
   * @type {number}
   * @memberof TrackedSession
   */
  public sessionExpiry = 0

  /**
   * One time login code
   * @type {string}
   * @memberof Session
   */
  public otl = ''

  /**
   * One time login code's usage status
   *
   * Note: Once consumed a new one will need to be generated to login via the webportal
   * @type {boolean}
   * @memberof Session
   */
  public otlConsumed = false

  /**
   * One time login expiry timestamp (5 mins from creation)
   * @type {number}
   * @memberof TrackedSession
   */
  public otlExpiry = 0

  /**
   * Tracking for which webportal session is for
   * @type {('kiera-web' | 'kiera-ck')}
   * @memberof TrackedSession
   */
  public generatedFor: 'kiera-web' | 'kiera-ck' = undefined

  /**
   * Is set to 'true' when the session has been found to be expired or is logged out
   * @type {boolean}
   * @memberof TrackedSession
   */
  public terminated = false

  constructor(init?: Partial<TrackedSession>) {
    Object.assign(this, init || {})
  }

  public newOTL() {
    // Only generate a new OTL if session does not exist
    if (this.session) throw new Error('Cannot create a OTL on a session that already exists.')
    // Generate OTL
    const otl = `${crypto.SHA256(Math.random().toString()).toString().substr(0, 8)}`

    // Set OTL on Session
    this.otl = otl

    // Set Expiry
    this.otlExpiry = Date.now() / 1000 + 300 // 5 Minutes
  }
}
