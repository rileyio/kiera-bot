import { ObjectID } from 'bson';

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

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init);
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
    Object.assign(this, init);
  }
}

export class TrackedChastiKeyPreferences {
  keyholder: { showAverage: boolean } = {
    showAverage: false
  }

  constructor(init: Partial<TrackedChastiKeyPreferences>) {
    Object.assign(this, init);
  }
}

/**
 * ChastiKey User Record Data
 * 
 * Stored In DB Collection: `ck-users`
 *
 * Found at: https://chastikey.com/json/v1.0/kiera_user_data.json
 * @export
 * @class TrackedChastiKeyUser
 */
export class TrackedChastiKeyUser {
  public _noData: boolean = true
  public userID: number
  public username: number | string
  public discordID: number = null
  public displayInStats: number
  public joined: string
  public keyholderLevel: number
  public lockeeLevel: number
  public mainRole: number
  public status: number
  public timestampLastActive: number

  constructor(init: Partial<TrackedChastiKeyUser>) {
    Object.assign(this, init);
    this._noData = !init ? true : false
    // Transform Username if needed to a string
    this.username = String(this.username)
  }

  public isVerified() {
    return this.discordID !== null
  }
}

/**
 * ChastiKey cached user stats
 * 
 * Stored In DB Collection: `ck-lockees`
 * 
 * Found at: https://chastikey.com/api/kiera/lockees_data.json
 * @export
 * @class TrackedChastiKeyLockee
 */
export class TrackedChastiKeyLockee {
  public readonly _hasDBData: boolean = false
  public username: string
  public joined: string
  public timestampLastActive: number
  public secondsLockedInCurrentLock: number
  public averageTimeLockedInSeconds: number
  public longestCompletedLockInSeconds: number
  public totalNoOfCompletedLocks: number
  public averageRating: number
  public noOfRatings: number
  public discordID: number

  constructor(init: Partial<TrackedChastiKeyLockee>) {
    this._hasDBData = init === null ? false : true
    Object.assign(this, init !== null ? init : {});
  }

  /**
   * Compares what's in Kiera's DB for known Discord ID's and compares against what ChastiKey knows as verified
   * @param {number} knownID
   * @returns
   * @memberof TrackedChastiKeyLockee
   */
  public isVerified(knownID: number) {
    return this.discordID === knownID
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
export class TrackedChastiKeyLock {
  // Kiera props
  public readonly _id: ObjectID
  // ChastiKey Props
  /**
   * ChastiKey user unique ID
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public userID: number
  /**
   * ChastiKey Username
   * @type {string}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public username: string
  /**
   * Discord Showflake
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public discordID: number
  /**
   * Date Joined ChastiKey App
   * @type {string}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public sharedLockID: string
  public regularity: number
  public multipleGreensRequired: number
  public timestampLocked: number
  public timestampNow: number
  public secondsLocked: number
  public fixed: number
  public cumulative: number
  public cardInfoHidden: number
  public timerHidden: number
  public noOfTurns: number
  public lockFrozenByCard: number
  public lockFrozenByKeyholder: number
  public discardPile: string
  public lockedBy: string
  public displayInStats: number
  public sharedLockName: string
  /// Cards ///
  public doubleUpCards: number
  public freezeCards: number
  public greenCards: number
  public redCards: number
  public resetCards: number
  public yellowCards: number
}

export class ProposedChastiKeyUserResponse {
  public discordID: number           // Discord ID
  // Would like to get this if possible when the lookup by discordID 
  // happens, would help with eliminating the need for setting a username
  public username: string            // ChastiKey Username
  public status: number              // Status code (200, 400)
  public message: string             // Status message (Success, $error)
  public timestampGenerated: number
  public locks: Array<{            /* Array Keys: */
    lockedBy: string                 // Keyholder
    combination: number              // Combination
    lockID: number                   // Lock ID
    lockName: number | string        // Lock Name
    timestampLocked: number          // When the lock started
    timestampUnlocked: number        // When the lock unlocked
  }>
}

/**
 * Lookup for basic past lock details & combinations
 * 
 * Found at: http://chastikey.com/api/kiera/combinations.php?discord_id=146439529824256000
 * @export
 * @class TrackedChastiKeyCombinationsAPIFetch
 */
export class TrackedChastiKeyCombinationsAPIFetch {
  public discordID: number
  public status: number
  public message: string
  public timestampGenerated: number
  // Different from TrackedChastiKeyUserAPIFetchLock
  public locks: Array<{
    combination: number
    lock_id: number
    lock_name: number | string
    timestamp_unlocked: number
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
  public discordID: number
  public username: string
  public locks: Array<TrackedChastiKeyUserAPIFetchLock>
}

export class TrackedChastiKeyUserAPIFetchLock {
  public lockID: number
  public lockedBy: string
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
 * ChastiKey Keyholder Statistcs
 * @export
 * @class TrackedChastiKeyKeyholderStatistics
 */
export class TrackedChastiKeyKeyholderStatistics {
  /**
   * ChastiKey user unique ID
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public userID: number
  /**
   * ChastiKey Username
   * @type {string}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public username: string
  /**
   * Discord Showflake
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public discordID: number
  /**
   * Date Joined ChastiKey App
   * @type {string}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public joined: string
  /**
   * # of locks created (not active, non-deleted)
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public noOfSharedLocks: number = 0
  /**
   * # of active Locks (Running now)
   *
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public noOfLocksManagingNow: number = 0
  /**
   * # of lockee's who have flagged KH as trusted
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public noOfLocksFlaggedAsTrusted: number = 0
  /**
   * # of locks loaded and used (inc current)
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public totalLocksManaged: number = 0
  /**
   * Average KH Rating provided by ChastiKey
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public averageRating: number
  /**
   * Number of Ratings from ChastiKey
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public noOfRatings: number
  /**
   * If KH want's their stats displayed
   * @type {number}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public displayInStats: number
  /**
   * Date User began keyholding
   * @type {string}
   * @memberof TrackedChastiKeyKeyholderStatistics
   */
  public dateFirstKeyheld: string


  constructor(init: Partial<TrackedChastiKeyKeyholderStatistics>) {
    Object.assign(this, init)
  }

  /**
   * Compares what's in Kiera's DB for known Discord ID's and compares against what ChastiKey knows as verified
   * @param {number} knownID
   * @returns
   * @memberof TrackedChastiKeyLockee
   */
  public isVerified(knownID: number) {
    return this.discordID === knownID
  }
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
    Object.assign(this, init);
  }
}

export class ChastiKeyVerifyDiscordID {
  public status: 200 | 400
  public message: string
  public timestampGenerated: number
  public discordID: number = 0
  public username: string = ''
  public verified: boolean = false

  constructor(init: Partial<ChastiKeyVerifyDiscordID>) {
    Object.assign(this, init);
  }
}