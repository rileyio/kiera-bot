import { ObjectID } from 'bson';

export enum ChastiKeyTickerType {
  None,
  Keyholder,
  Lockee,
  Both
}

export class TrackedChastiKey {
  public username: string = ''
  public ticker: TrackedChastiKeyTicker = new TrackedChastiKeyTicker({})
  public preferences: TrackedChastiKeyPreferences = new TrackedChastiKeyPreferences({})
  public isVerified: boolean = false
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

export class TrackedChastiKeyLock {
  // Kiera props
  public readonly _id: ObjectID
  // Mapped in after
  public keyholder: string
  // ChastiKey Props
  public username: string
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

export class TrackedChastiKeyUserAPIFetch {
  public response: Array<{ status: number; message: string; timestampGenerated: number }>
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
 * @class TrackedKeyholderStatistics
 */
export class TrackedKeyholderStatistics {
  /**
   * ChastiKey Username
   * @type {string}
   * @memberof TrackedKeyholderStatistics
   */
  public username: string
  /**
   * Date Joined ChastiKey App
   * @type {string}
   * @memberof TrackedKeyholderStatistics
   */
  public joined: string
  /**
   * # of locks created (not active, non-deleted)
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public noOfSharedLocks: number = 0
  /**
   * # of active Locks (Running now)
   *
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public noOfLocksManagingNow: number = 0
  /**
   * # of lockee's who have flagged KH as trusted
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public noOfLocksFlaggedAsTrusted: number = 0
  /**
   * # of locks loaded and used (inc current)
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public totalLocksManaged: number = 0
  /**
   * Average KH Rating provided by ChastiKey
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public averageRating: number
  /**
   * Number of Ratings from ChastiKey
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public noOfRatings: number
  /**
   * If KH want's their stats displayed
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public displayInStats: number
  /**
   * Date User began keyholding
   * @type {string}
   * @memberof TrackedKeyholderStatistics
   */
  public dateFirstKeyheld: string
  /**
   * Discord Showflake
   * @type {number}
   * @memberof TrackedKeyholderStatistics
   */
  public discordID: number

  constructor(init: Partial<TrackedKeyholderStatistics>) {
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

  constructor(init: Partial<ChastiKeyVerifyResponse>) {
    Object.assign(this, init);
  }
}