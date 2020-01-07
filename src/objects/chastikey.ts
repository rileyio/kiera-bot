import { ObjectID } from 'bson'
import { RunningLocksLock } from 'chastikey.js/app/objects'

export enum ChastiKeyTickerType {
  None,
  Keyholder,
  Lockee,
  Both
}

/**
 * Kiera's Database Record Object for ChastiKey settings/profile
 * @export
 * @class TrackedChastiKey
 */
export class TrackedChastiKey {
  public username: string = ''
  public ticker: TrackedChastiKeyTicker = new TrackedChastiKeyTicker({})
  public preferences: TrackedChastiKeyPreferences = new TrackedChastiKeyPreferences({})
  public isVerified: boolean = false
  public isVerifiedInData: boolean = false
  public verificationCode: string = ''
  public verificationCodeRequestedAt: number = 0
  public displayInStats: boolean = false

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init)
  }
}

/**
 * Data specific to the KeyTicker
 *
 * Username should be fetched from the User's TrackedChastiKey data
 *
 * @export
 * @class TrackedChastiKeyTicker
 */
export class TrackedChastiKeyTicker {
  public type: ChastiKeyTickerType = ChastiKeyTickerType.Lockee
  public showStarRatingScore: boolean = false
  public date: string

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init)
  }
}

export class TrackedChastiKeyPreferences {
  public keyholder: { showAverage: boolean } = {
    showAverage: false
  }
  public lockee: { allowPublicHistory: boolean; limitMonths: 3 | 6 | 12 } = {
    allowPublicHistory: false,
    limitMonths: 3
  }

  constructor(init: Partial<TrackedChastiKeyPreferences>) {
    Object.assign(this, init)
  }
}

/**
 * ChastiKey cached running lock
 *
 * Stored In DB Collection: `ck-running-locks`
 *
 * Found at: https://chastikey.com/api/kiera/running_locks.json
 * @export
 * @class TrackedChastiKeyLockee
 */
export class TrackedChastiKeyLock extends RunningLocksLock {
  // Kiera props
  public readonly _id: ObjectID
  // ChastiKey Extra Props from DB Query
  public secondsLocked: number
}

/**
 * Lookup for basic past lock details & combinations
 *
 * Found at: http://chastikey.com/api/kiera/combinations.php?discord_id=146439529824256000
 * @export
 * @class TrackedChastiKeyCombinationsAPIFetch
 */
export class TrackedChastiKeyCombinationsAPIFetch {
  public discordID: string
  public status: number
  public message: string
  public timestampGenerated: number
  // Different from TrackedChastiKeyUserAPIFetchLock
  public locks: Array<{
    combination: number
    lockID: number
    lockName: number | string
    timestampUnlocked: number
  }>
}

/**
 * Standard Realtime User lookup
 *
 * Found at: https://chastikey.com/api/v0.3/listlocks2.php?username=Emma&showdeleted=0&bot=Kiera
 * @export
 * @class TrackedChastiKeyUserAPIFetch
 */
export class TrackedChastiKeyUserAPIFetch {
  public status: 200 | 400
  public message: 'Success' | 'Discord ID or username not recognised'
  public timestampGenerated: number
  public discordID: string
  public username: string
  public locks: Array<TrackedChastiKeyUserAPIFetchLock>
}

export class TrackedChastiKeyUserAPIFetchLock {
  public lockID: number
  public lockDeleted: boolean | number
  public lockedBy: string
  public lockFrozen: boolean
  public timestampDeleted: number
  public timestampLocked: number
  public timestampUnlocked: number
  public status: 'UnlockedReal' | 'Locked' | 'ReadyToUnlock'
  public combination: number
}

export class TrackedChastiKeyUserTotalLockedTime {
  public username: string
  public totalSecondsLocked: number
  public totalMonthsLocked: number
}

/**
 * Response from ChastiKey server when starting verification
 * @export
 * @class ChastiKeyVerifyResponse
 */
export class ChastiKeyVerifyResponse {
  public success: boolean = false
  /**
   * Known responses:
   * - `Your DiscordID has already been registered.`
   * - `You have already been issued a code. Please try again shortly.`
   * - `Generic error, Please try again.`
   * - `Fatal error, Please try again.`
   * - `Missing post data.`
   *
   * @type {string}
   * @memberof ChastiKeyVerifyResponse
   */
  public reason: string = ''
  public code: string
  public isVerified: boolean = false

  constructor(init: Partial<ChastiKeyVerifyResponse>) {
    Object.assign(this, init)
  }
}

export class ChastiKeyVerifyDiscordID {
  public status: 200 | 400
  public message: string
  public timestampGenerated: number
  public discordID: string = null
  public username: string = ''
  public verified: boolean = false

  constructor(init: Partial<ChastiKeyVerifyDiscordID>) {
    Object.assign(this, init)
  }
}
