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
  public startDateDD: number
  public startDateMM: number
  public startDateYY: number

  constructor(init: Partial<TrackedChastiKey>) {
    Object.assign(this, init);
  }
}

export class TrackedChastiKeyLockee {
  public username: string
  public joined: string
  public timestamp_last_active: number
  public secondsLockedInCurrentLock: number
  public averageTimeLockedInSeconds: number
  public longestCompletedLockInSeconds: number
  public totalNoOfCompletedLocks: number
  public averageRating: number
  public noOfRatings: number
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
  public card_info_hidden: number
  public timer_hidden: number
  public noOfTurns: number
  public lock_frozen_by_card: number
  public lock_frozen_by_keyholder: number
  public discard_pile: string
  public version: string
  public build: number
}

export class TrackedChastiKeyUserAPIFetch {
  public response: Array<{ status: number; message: string; timestampGenerated: number }>
  public locks: Array<TrackedChastiKeyUserAPIFetchLock>
}

export class TrackedChastiKeyUserAPIFetchLock {
  lockID: number
  lockedBy: string
  timestampLocked: number
  timestampUnlocked: number
  status: string
  combination: number
}

export class TrackedChastiKeyUserTotalLockedTime {
  username: string
  totalSecondsLocked: number
  totalMonthsLocked: number
}